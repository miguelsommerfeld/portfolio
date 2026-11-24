import type { AuthProvider, UserPayload } from "@shared/schemas/jwt.schema";
import {
  AuthError,
  type OAuthProvider,
} from "@/modules/auth/providers/oauth-provider";

export class AuthService {
  private readonly providers = new Map<AuthProvider, OAuthProvider>();

  constructor(providers: readonly OAuthProvider[]) {
    for (const provider of providers) {
      if (this.providers.has(provider.name)) {
        throw new Error(`Duplicate OAuth provider registered: ${provider.name}`);
      }
      this.providers.set(provider.name, provider);
    }
  }

  public getProviders(): readonly OAuthProvider[] {
    return [...this.providers.values()];
  }

  public async authenticateWithProvider(
    providerName: AuthProvider,
    accessToken: string,
  ): Promise<UserPayload> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new AuthError(
        "UNSUPPORTED_PROVIDER",
        `OAuth provider "${providerName}" is not registered.`,
      );
    }

    return provider.fetchUserProfile(accessToken);
  }

  public buildFrontendRedirectUrl(
    frontendBaseUrl: string,
    path: string,
    errorCode?: string,
  ): string {
    const redirectUrl = new URL(path, frontendBaseUrl);

    if (errorCode) {
      redirectUrl.searchParams.set("error", errorCode);
    }

    return redirectUrl.toString();
  }
}
