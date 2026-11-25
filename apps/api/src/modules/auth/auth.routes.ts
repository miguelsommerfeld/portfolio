import fastifyOauth2 from "@fastify/oauth2";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import type { FastifyTypedInstance } from "@/types/fastify";
import { z } from "zod";
import { env } from "@shared/config/env";
import { authErrorResponseSchema, authMeResponseSchema, oauthCallbackQuerySchema, } from "@/modules/auth/auth.schema";
import { authenticate } from "@/modules/auth/middlewares/auth.middleware";
import { AuthError, type OAuthProvider, toProviderResponse } from "@/modules/auth/providers/oauth-provider";
import { SESSION_COOKIE_NAME } from "@/modules/auth/token.service";

async function registerOAuthProviderRoutes(
  server: FastifyTypedInstance,
  provider: OAuthProvider,
): Promise<void> {
  await server.register(fastifyOauth2, toProviderResponse(provider));

  server.get(`/${provider.name}/callback`, {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute",
      },
    },
    schema: {
      querystring: oauthCallbackQuerySchema,
      response: {
        302: z.undefined(),
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

export const authRoutes: FastifyPluginAsyncZod = async function (
  server: FastifyTypedInstance,
) {
  for (const provider of server.authService.getProviders()) {
    await registerOAuthProviderRoutes(server, provider);
  }

  server.get("/me", {
    preHandler: [authenticate],
    schema: {
      response: {
        200: authMeResponseSchema,
        401: authErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      return reply.status(200).send({ user: request.user });
    },
  });

  server.post("/logout", {
    schema: {
      response: {
        204: z.undefined(),
      },
    },
    handler: async (_request, reply) => {
      reply.clearCookie(SESSION_COOKIE_NAME, server.tokenService.getClearCookieOptions());
      return reply.status(204).send();
    },
  });
};
