import { z } from "zod";

export const authProviderSchema = z.enum(["google", "github"]).describe("OAuth2 authentication provider identifier.");
export type AuthProvider = z.infer<typeof authProviderSchema>;

export const userPayloadSchema = z.object({
  sub: z.string().min(1).describe("Unique user identifier provided by the OAuth2 provider."),
  email: z.email().describe("Verified email address of the authenticated user."),
  name: z.string().min(1).describe("Display name of the authenticated user."),
  picture: z.url().optional().describe("Profile avatar URL, when available."),
  provider: authProviderSchema,
}).describe("Normalized authenticated user profile stored in the JWT session payload.");

export type UserPayload = z.infer<typeof userPayloadSchema>;
