import { z } from "zod";

export const authProviderSchema = z.enum(["google", "github"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

export const userPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  name: z.string().min(1),
  picture: z.url().optional(),
  provider: authProviderSchema,
});

export type UserPayload = z.infer<typeof userPayloadSchema>;
