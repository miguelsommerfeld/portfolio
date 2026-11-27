import path from "node:path";
import { fileURLToPath } from "node:url";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "@fastify/type-provider-zod";
import fastify from "fastify";
import { env } from "@shared/config/env";
import { swaggerOptions, swaggerUiOptions } from "@/config/swagger";
import { authRoutes } from "@/modules/auth/auth.routes";
import { AuthService } from "@/modules/auth/auth.service";
import { oauthProviders } from "@/modules/auth/providers/index";
import type { OAuthProvider } from "@/modules/auth/providers/oauth-provider";
import { SESSION_COOKIE_NAME, TokenService } from "@/modules/auth/token.service";
import { healthRoutes } from "@/modules/health/health.routes";
import { resumeRoutes } from "@/modules/resume/resume.routes";
import { ResumeService } from "@/modules/resume/resume.service";
import type { FastifyTypedInstance } from "@/types/fastify";

export async function buildServer(providers: readonly OAuthProvider[] = oauthProviders): Promise<FastifyTypedInstance> {
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
    exposedHeaders: ["Content-Disposition", "X-Resume-Variant"],
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

  await server.register(swagger, swaggerOptions);
  await server.register(swaggerUi, swaggerUiOptions);

  server.decorate("authService", new AuthService(providers));
  server.decorate("tokenService", new TokenService(server.jwt));
  server.decorate("resumeService", new ResumeService());

  await server.register(healthRoutes, { prefix: "/health" });
  await server.register(authRoutes, { prefix: "/auth" });
  await server.register(resumeRoutes, { prefix: "/resume" });

  return server;
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const server = await buildServer();
  await server.listen({ port: env.PORT, host: "0.0.0.0" });
}
