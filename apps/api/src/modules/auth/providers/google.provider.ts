import fastifyOauth2 from "@fastify/oauth2";
import { z } from "zod";
import { env } from "@shared/config/env";
import type { UserPayload } from "@shared/schemas/jwt.schema";
import {
  AuthError,
  type OAuthProvider,
} from "@/modules/auth/providers/oauth-provider";

const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const USERINFO_TIMEOUT_MS = 10_000;

const googleUserInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  email_verified: z.boolean(),
  name: z.string().min(1),
  picture: z.url().optional(),
});

export const googleProvider: OAuthProvider<"google"> = {
  name: "google",
  oauth2PluginName: "oauth2Google",
  scope: ["openid", "email", "profile"],
  credentials: {
    client: {
      id: env.GOOGLE_CLIENT_ID,
      secret: env.GOOGLE_CLIENT_SECRET,
    },
    auth: fastifyOauth2.GOOGLE_CONFIGURATION,
  },
  callbackUri: env.GOOGLE_CALLBACK_URL,
  pkce: "S256",

  async fetchUserProfile(accessToken: string): Promise<UserPayload> {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(USERINFO_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new AuthError(
        "GOOGLE_USERINFO_FAILED",
        `Google userinfo request failed with status ${response.status}.`,
      );
    }

    const rawData: unknown = await response.json();
    const parsed = googleUserInfoSchema.safeParse(rawData);

    if (!parsed.success) {
      throw new AuthError(
        "INVALID_GOOGLE_PROFILE",
        "Google user profile payload did not match expected schema.",
      );
    }

    if (!parsed.data.email_verified) {
      throw new AuthError(
        "EMAIL_NOT_VERIFIED",
        "Google account email must be verified.",
      );
    }

    return {
      sub: parsed.data.sub,
      email: parsed.data.email,
      name: parsed.data.name,
      picture: parsed.data.picture,
      provider: "google",
    };
  },
};
