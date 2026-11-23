import { z, ZodObject } from "zod";
import type { ProviderInfo } from "./auth.schema";

export class AuthService
{
  public googleAuthentication()
  {
  }

  public githubAuthentication()
  {}

  private authenticationConfig(providerInfo: ProviderInfo): ZodObject
  {
    return z.object({
      name: providerInfo.providerName,
      credentials: {
        client: {
          id: providerInfo.clientId,
          secret: providerInfo.clientSecret
        },
        auth: providerInfo.config
      },
      startRedirectPath: providerInfo.redirectPath,
      callbackUri: providerInfo.callbackUri
    })
  }
}