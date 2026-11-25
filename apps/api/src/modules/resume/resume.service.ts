import { createHmac, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { access, constants } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "@shared/config/env";
import type { UserPayload } from "@shared/schemas/jwt.schema";
import type { ResumeCodeResponse } from "@/modules/resume/resume.schema";

export type ResumeVariant = "censored" | "full";
export type ResumeErrorCode = "INVALID_RESUME_CODE" | "RESUME_FILE_UNAVAILABLE";

export interface ResolvedResumeFile {
  filePath: string;
  filename: string;
  variant: ResumeVariant;
}

export interface ResumeServiceOptions {
  accessSecret?: string;
  ownerEmails?: readonly string[];
  timeZone?: string;
  censoredFilePath?: string;
  fullFilePath?: string;
}

export class ResumeError extends Error
{
  constructor(
    public readonly code: ResumeErrorCode,
    message: string,
  )
  {
    super(message);
    this.name = "ResumeError";
  }
}

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function resolveApiRootDir(): string {
  let currentDir = path.dirname(fileURLToPath(import.meta.url));

  while (true) {
    if (existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return process.cwd();
    }
    currentDir = parentDir;
  }
}

function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getDatePartsInTimeZone(date, timeZone);
  const asUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const truncatedUtcMs = Math.floor(date.getTime() / 1000) * 1000;
  return asUtcMs - truncatedUtcMs;
}

function getStartOfNextDayIso(year: number, month: number, day: number, timeZone: string): string {
  const nextUtcMidnightMs = Date.UTC(year, month - 1, day + 1, 0, 0, 0);
  const initialGuessMs = nextUtcMidnightMs - getTimeZoneOffsetMs(new Date(nextUtcMidnightMs), timeZone);
  const refinedMs = nextUtcMidnightMs - getTimeZoneOffsetMs(new Date(initialGuessMs), timeZone);
  return new Date(refinedMs).toISOString();
}

export class ResumeService
{
  private readonly accessSecret: string;
  private readonly ownerEmails: ReadonlySet<string>;
  private readonly timeZone: string;
  private readonly censoredFilePath: string;
  private readonly fullFilePath: string;

  constructor(options: ResumeServiceOptions = {})
  {
    const apiRootDir = resolveApiRootDir();
    this.accessSecret = options.accessSecret ?? env.RESUME_ACCESS_SECRET;
    this.ownerEmails = new Set((options.ownerEmails ?? env.OWNER_EMAILS).map((email) => email.trim().toLowerCase()));
    this.timeZone = options.timeZone ?? env.RESUME_TIMEZONE;
    this.censoredFilePath = options.censoredFilePath ?? path.join(apiRootDir, "assets", "curriculo-dev-censurado.pdf");
    this.fullFilePath = options.fullFilePath ?? path.join(apiRootDir, "private", "curriculo-dev.pdf");
  }

  public isOwner(user: UserPayload): boolean
  {
    return this.ownerEmails.has(user.email.trim().toLowerCase());
  }

  public generateDailyCode(referenceDate: Date = new Date()): ResumeCodeResponse
  {
    const parts = getDatePartsInTimeZone(referenceDate, this.timeZone);
    const validForDate = `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
    const rawCode = this.deriveRawCode(validForDate);
    const code = `${rawCode.slice(0, 4)}-${rawCode.slice(4, 8)}`;
    const expiresAt = getStartOfNextDayIso(parts.year, parts.month, parts.day, this.timeZone);

    return { code, validForDate, expiresAt };
  }

  public validateAccessCode(providedCode: string, referenceDate: Date = new Date()): boolean
  {
    const normalizedInput = providedCode.replace(/[\s-]+/g, "").toUpperCase();
    const { validForDate } = this.generateDailyCode(referenceDate);
    const expectedCode = this.deriveRawCode(validForDate);

    const inputBuffer = Buffer.from(normalizedInput, "utf8");
    const expectedBuffer = Buffer.from(expectedCode, "utf8");

    if (inputBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(inputBuffer, expectedBuffer);
  }

  public async resolveResumeFile(providedCode?: string, referenceDate: Date = new Date()): Promise<ResolvedResumeFile>
  {
    const trimmedCode = providedCode?.trim();
    let variant: ResumeVariant = "censored";

    if (trimmedCode) {
      if (!this.validateAccessCode(trimmedCode, referenceDate)) {
        throw new ResumeError("INVALID_RESUME_CODE", "Resume access code is invalid or expired.");
      }
      variant = "full";
    }

    const filePath = variant === "full" ? this.fullFilePath : this.censoredFilePath;

    try {
      await access(filePath, constants.R_OK);
    } catch {
      throw new ResumeError("RESUME_FILE_UNAVAILABLE", "Requested resume file is currently unavailable.");
    }

    return {
      filePath,
      filename: path.basename(filePath),
      variant,
    };
  }

  private deriveRawCode(validForDate: string): string
  {
    return createHmac("sha256", this.accessSecret).update(`resume:${validForDate}`).digest("hex").slice(0, 8).toUpperCase();
  }
}
