import { z } from "zod";
import { userPayloadSchema } from "@shared/schemas/jwt.schema";

export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1).optional().describe("Authorization code returned by the OAuth2 provider."),
  state: z.string().min(1).optional().describe("Opaque CSRF protection state value matching the signed state cookie."),
  error: z.string().optional().describe("OAuth2 error code returned when authorization is denied or fails."),
  error_description: z.string().optional().describe("Human-readable error description returned by the OAuth2 provider."),
});

export const authMeResponseSchema = z.object({
  user: userPayloadSchema,
});

export const authErrorResponseSchema = z.object({
  error: z.string().describe("Machine-readable error code."),
  message: z.string().describe("Human-readable error description."),
});
