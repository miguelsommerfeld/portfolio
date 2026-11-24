import type { CookieSerializeOptions } from "@fastify/cookie";
import type { UserPayload } from "@shared/schemas/jwt.schema";
import { env } from "@shared/config/env";

export const SESSION_COOKIE_NAME = "access_token";

export interface JwtSigner {
  sign(payload: UserPayload): string;
}

const DURATION_MULTIPLIERS_IN_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

function parseDurationToSeconds(duration: string): number | undefined {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  return amount * DURATION_MULTIPLIERS_IN_SECONDS[unit];
}

export class TokenService {
  constructor(private readonly jwt: JwtSigner) {}

  public createSessionToken(user: UserPayload): string {
    return this.jwt.sign(user);
  }

  public getSessionCookieOptions(): CookieSerializeOptions {
    const maxAge = parseDurationToSeconds(env.JWT_EXPIRES_IN);

    return {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      signed: false,
      ...(maxAge !== undefined ? { maxAge } : {}),
    };
  }

  public getClearCookieOptions(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };
  }
}
