import type { Credentials, FastifyOAuth2Options } from "@fastify/oauth2";
import type { AuthProvider, UserPayload } from "@shared/schemas/jwt.schema";
import { env } from "@shared/config/env";

export type OAuth2PluginName<P extends AuthProvider = AuthProvider> =
  `oauth2${Capitalize<P>}`;

export interface OAuthProvider<P extends AuthProvider = AuthProvider> {
  readonly name: P;
  readonly oauth2PluginName: OAuth2PluginName<P>;
  readonly scope: string[];
  readonly credentials: Credentials;
  readonly callbackUri: string;
  readonly pkce?: "S256" | "plain";
  fetchUserProfile(accessToken: string): Promise<UserPayload>;
}

export function toProviderResponse(provider: OAuthProvider): FastifyOAuth2Options {
  return {
    name: provider.oauth2PluginName,
    scope: provider.scope,
    credentials: provider.credentials,
    startRedirectPath: `/${provider.name}`,
    callbackUri: provider.callbackUri,
    ...(provider.pkce ? { pkce: provider.pkce } : {}),
    redirectStateCookieName: `oauth2-${provider.name}-state`,
    verifierCookieName: `oauth2-${provider.name}-verifier`,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      signed: true,
    },
  }
}

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
