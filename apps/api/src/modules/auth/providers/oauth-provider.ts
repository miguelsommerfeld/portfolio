import type { Credentials, FastifyOAuth2Options } from "@fastify/oauth2";
import { z } from "zod";
import type { AuthProvider, UserPayload } from "@shared/schemas/jwt.schema";
import { env } from "@shared/config/env";

const PROVIDER_DISPLAY_NAMES: Partial<Record<AuthProvider, string>> = {
  google: "Google",
  github: "GitHub",
};

export function formatProviderName(name: AuthProvider): string {
  return PROVIDER_DISPLAY_NAMES[name] ?? `${name[0].toUpperCase()}${name.slice(1)}`;
}

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
  const displayName = formatProviderName(provider.name);

  return {
    name: provider.oauth2PluginName,
    scope: provider.scope,
    credentials: provider.credentials,
    startRedirectPath: `/${provider.name}`,
    callbackUri: provider.callbackUri,
    ...(provider.pkce ? { pkce: provider.pkce } : {}),
    redirectStateCookieName: `oauth2-${provider.name}-state`,
    verifierCookieName: `oauth2-${provider.name}-verifier`,
    schema: {
      tags: ["Auth"],
      summary: `Start ${displayName} OAuth2 login`,
      description: `Initiates the ${displayName} OAuth2 authorization code flow${provider.pkce ? ` (PKCE ${provider.pkce})` : ""}, sets signed state cookies, and redirects the browser to the ${displayName} consent page.`,
      response: {
        302: z.undefined().meta({
          headers: {
            Location: {
              type: "string",
              format: "uri",
              description: `${displayName} OAuth2 authorization URL.`,
            },
          },
        }).describe(`Redirects to the ${displayName} OAuth2 authorization page.`),
      },
    },
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      signed: true,
    },
  };
}

export class AuthError extends Error
{
  constructor(
    public readonly code: string,
    message: string,
  )
  {
    super(message);
    this.name = "AuthError";
  }
}
