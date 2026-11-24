import path from "node:path";
import { fileURLToPath } from "node:url";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import fastify from "fastify";
import { env } from "@shared/config/env";
import { authRoutes } from "@/modules/auth/auth.routes";
import { AuthService } from "@/modules/auth/auth.service";
import { oauthProviders } from "@/modules/auth/providers/index";
import type { OAuthProvider } from "@/modules/auth/providers/oauth-provider";
import {
  SESSION_COOKIE_NAME,
  TokenService,
} from "@/modules/auth/token.service";
import type { FastifyTypedInstance } from "@/types/fastify";

export async function buildServer(
  providers: readonly OAuthProvider[] = oauthProviders,
): Promise<FastifyTypedInstance> {
  const server = fastify({
    logger: env.NODE_ENV !== "test",
  }).withTypeProvider<ZodTypeProvider>();

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  const frontendOrigin = new URL(env.FRONTEND_URL).origin;

  await server.register(cors, {
    origin: [frontendOrigin],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await server.register(cookie, {
    secret: env.COOKIE_SECRET,
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await server.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: SESSION_COOKIE_NAME,
      signed: false,
    },
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  server.decorate("authService", new AuthService(providers));
  server.decorate("tokenService", new TokenService(server.jwt));

  await server.register(authRoutes, { prefix: "/auth" });

  return server;
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const server = await buildServer();
  await server.listen({ port: env.PORT, host: "0.0.0.0" });
}
