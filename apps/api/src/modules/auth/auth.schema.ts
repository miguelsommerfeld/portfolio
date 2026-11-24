import { z } from "zod";
import { userPayloadSchema } from "@shared/schemas/jwt.schema";

export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const authMeResponseSchema = z.object({
  user: userPayloadSchema,
});

export const authErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});
