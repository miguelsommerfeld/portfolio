import type { Credentials } from "@fastify/oauth2";
import type { AuthProvider, UserPayload } from "@shared/schemas/jwt.schema";

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

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
