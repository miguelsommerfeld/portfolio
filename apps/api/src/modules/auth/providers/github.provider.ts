import fastifyOauth2 from "@fastify/oauth2";
import { z } from "zod";
import { env } from "@shared/config/env";
import type { UserPayload } from "@shared/schemas/jwt.schema";
import { AuthError, type OAuthProvider } from "@/modules/auth/providers/oauth-provider";

const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_USER_AGENT = "portfolio-api";
const USERINFO_TIMEOUT_MS = 10_000;

const githubUserSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
  name: z.string().nullable().optional(),
  avatar_url: z.union([z.url(), z.literal("")]).nullable().optional(),
});

const githubEmailsSchema = z.array(z.object({
  email: z.email(),
  primary: z.boolean(),
  verified: z.boolean(),
}));

function buildGithubHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": GITHUB_USER_AGENT,
  };
}

export const githubProvider: OAuthProvider<"github"> = {
  name: "github",
  oauth2PluginName: "oauth2Github",
  scope: ["read:user", "user:email"],
  credentials: {
    client: {
      id: env.GITHUB_CLIENT_ID,
      secret: env.GITHUB_CLIENT_SECRET,
    },
    auth: fastifyOauth2.GITHUB_CONFIGURATION,
  },
  callbackUri: env.GITHUB_CALLBACK_URL,
  pkce: "S256",

  async fetchUserProfile(accessToken: string): Promise<UserPayload> {
    if (!accessToken) {
      throw new AuthError("INVALID_ACCESS_TOKEN", "GitHub OAuth token exchange did not return an access token.");
    }

    const headers = buildGithubHeaders(accessToken);
    const [userResponse, emailsResponse] = await Promise.all([
      fetch(GITHUB_USER_URL, { headers, signal: AbortSignal.timeout(USERINFO_TIMEOUT_MS) }),
      fetch(GITHUB_EMAILS_URL, { headers, signal: AbortSignal.timeout(USERINFO_TIMEOUT_MS) }),
    ]);

    if (!userResponse.ok) {
      throw new AuthError("GITHUB_USERINFO_FAILED", `GitHub user request failed with status ${userResponse.status}.`);
    }

    if (!emailsResponse.ok) {
      throw new AuthError("GITHUB_EMAILS_FAILED", `GitHub emails request failed with status ${emailsResponse.status}.`);
    }

    const [rawUser, rawEmails]: [unknown, unknown] = await Promise.all([
      userResponse.json(),
      emailsResponse.json(),
    ]);

    const parsedUser = githubUserSchema.safeParse(rawUser);
    if (!parsedUser.success) {
      throw new AuthError("INVALID_GITHUB_PROFILE", "GitHub user profile payload did not match expected schema.");
    }

    const parsedEmails = githubEmailsSchema.safeParse(rawEmails);
    if (!parsedEmails.success) {
      throw new AuthError("INVALID_GITHUB_EMAILS", "GitHub user emails payload did not match expected schema.");
    }

    const verifiedEmail =
      parsedEmails.data.find((entry) => entry.primary && entry.verified)?.email ??
      parsedEmails.data.find((entry) => entry.verified)?.email;

    if (!verifiedEmail) {
      throw new AuthError("EMAIL_NOT_VERIFIED", "GitHub account email must be verified.");
    }

    const trimmedName = parsedUser.data.name?.trim();
    const displayName = trimmedName && trimmedName.length > 0 ? trimmedName : parsedUser.data.login;

    return {
      sub: String(parsedUser.data.id),
      email: verifiedEmail,
      name: displayName,
      picture: parsedUser.data.avatar_url || undefined,
      provider: "github",
    };
  },
};
