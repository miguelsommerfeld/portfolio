import { githubProvider } from "@/modules/auth/providers/github.provider";
import { googleProvider } from "@/modules/auth/providers/google.provider";
import type { OAuthProvider } from "@/modules/auth/providers/oauth-provider";

export const oauthProviders: readonly OAuthProvider[] = [googleProvider, githubProvider];
