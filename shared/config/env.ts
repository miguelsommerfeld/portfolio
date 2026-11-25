import { z } from "zod";

function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

const ownerEmailsSchema = z
  .string()
  .transform((value) => value.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean))
  .pipe(z.array(z.email()).min(1));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  FRONTEND_URL: z.url().default("http://localhost:4200"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.url(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default("1h"),
  RESUME_ACCESS_SECRET: z.string().min(32),
  OWNER_EMAILS: ownerEmailsSchema,
  RESUME_TIMEZONE: z.string().min(1).default("America/Sao_Paulo").refine(isValidTimeZone, "Invalid IANA time zone"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
