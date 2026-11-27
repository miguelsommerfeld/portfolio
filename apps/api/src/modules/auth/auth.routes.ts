import fastifyOauth2 from "@fastify/oauth2";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";
import { env } from "@shared/config/env";
import { authErrorResponseSchema, authMeResponseSchema, oauthCallbackQuerySchema } from "@/modules/auth/auth.schema";
import { authenticate } from "@/modules/auth/middlewares/auth.middleware";
import { AuthError, formatProviderName, type OAuthProvider, toProviderResponse } from "@/modules/auth/providers/oauth-provider";
import { SESSION_COOKIE_NAME } from "@/modules/auth/token.service";
import type { FastifyTypedInstance } from "@/types/fastify";

async function registerOAuthProviderRoutes(server: FastifyTypedInstance, provider: OAuthProvider): Promise<void> {
  const displayName = formatProviderName(provider.name);

  await server.register(fastifyOauth2, toProviderResponse(provider));

  server.get(`/${provider.name}/callback`, {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute",
      },
    },
    schema: {
      tags: ["Auth"],
      summary: `Handle ${displayName} OAuth2 callback`,
      description: `Exchanges the ${displayName} authorization code for an access token, fetches the normalized user profile, sets the stateless "${SESSION_COOKIE_NAME}" HttpOnly JWT cookie on success, and redirects to the frontend application ("/" on success or "/login?error=<code>" on failure).`,
      querystring: oauthCallbackQuerySchema,
      response: {
        302: z.undefined().meta({
          headers: {
            Location: {
              type: "string",
              format: "uri",
              description: "Frontend redirect URL (\"/\" on success or \"/login?error=<code>\" on failure).",
            },
          },
        }).describe("Redirects to the frontend application."),
      },
    },
    handler: async (request, reply) => {
      if (request.query.error) {
        const redirectUrl = server.authService.buildFrontendRedirectUrl(env.FRONTEND_URL, "/login", "access_denied");
        return reply.redirect(redirectUrl);
      }

      if (!request.query.code || !request.query.state) {
        const redirectUrl = server.authService.buildFrontendRedirectUrl(env.FRONTEND_URL, "/login", "invalid_callback");
        return reply.redirect(redirectUrl);
      }

      try {
        const oauthClient = server[provider.oauth2PluginName];

        if (!oauthClient) {
          throw new AuthError(
            "OAUTH_PROVIDER_NOT_CONFIGURED",
            `OAuth2 plugin "${provider.oauth2PluginName}" is not registered.`,
          );
        }

        const { token } = await oauthClient.getAccessTokenFromAuthorizationCodeFlow(request, reply);
        const user = await server.authService.authenticateWithProvider(provider.name, token.access_token);
        const sessionToken = server.tokenService.createSessionToken(user);

        reply.setCookie(SESSION_COOKIE_NAME, sessionToken, server.tokenService.getSessionCookieOptions());

        const redirectUrl = server.authService.buildFrontendRedirectUrl(env.FRONTEND_URL, "/");

        return reply.redirect(redirectUrl);
      } catch (err) {
        request.log.error(
          { err, provider: provider.name },
          "OAuth2 callback failed",
        );

        const errorCode = err instanceof AuthError
          ? err.code.toLowerCase()
          : "auth_failed";

        const redirectUrl = server.authService.buildFrontendRedirectUrl(env.FRONTEND_URL, "/login", errorCode);

        return reply.redirect(redirectUrl);
      }
    },
  });
}

export const authRoutes: FastifyPluginAsyncZod = async function (server: FastifyTypedInstance) {
  for (const provider of server.authService.getProviders()) {
    await registerOAuthProviderRoutes(server, provider);
  }

  server.get("/me", {
    preHandler: [authenticate],
    schema: {
      tags: ["Auth"],
      summary: "Get authenticated user",
      description: `Returns the authenticated user profile decoded from the stateless "${SESSION_COOKIE_NAME}" HttpOnly JWT cookie and whether the user can access the daily resume code.`,
      security: [{ cookieAuth: [] }],
      response: {
        200: authMeResponseSchema.describe("Authenticated user profile and resume code access permission."),
        401: authErrorResponseSchema.describe("Missing, expired, or invalid authentication cookie."),
      },
    },
    handler: async (request, reply) => {
      return reply.status(200).send({
        user: request.user,
        canAccessResumeCode: server.resumeService.isOwner(request.user),
      });
    },
  });

  server.post("/logout", {
    schema: {
      tags: ["Auth"],
      summary: "Log out current session",
      description: `Clears the stateless "${SESSION_COOKIE_NAME}" HttpOnly session cookie.`,
      response: {
        204: z.undefined().describe("Session cookie cleared successfully."),
      },
    },
    handler: async (_request, reply) => {
      reply.clearCookie(SESSION_COOKIE_NAME, server.tokenService.getClearCookieOptions());
      return reply.status(204).send();
    },
  });
};
