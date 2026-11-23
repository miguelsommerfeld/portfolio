import { z } from "zod"
import { ProviderConfiguration } from "@fastify/oauth2"

export const providerInfo = z.object({
  providerName: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  config: z.custom<ProviderConfiguration>(),
  redirectPath: z.string(),
  callbackUri: z.string()
})

export type ProviderInfo = z.infer<typeof providerInfo>;