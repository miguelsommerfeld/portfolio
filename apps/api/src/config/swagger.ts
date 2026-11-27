import type { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import type { FastifySwaggerUiOptions } from "@fastify/swagger-ui";
import { createJsonSchemaTransform, jsonSchemaTransformObject } from "@fastify/type-provider-zod";
import { SESSION_COOKIE_NAME } from "@/modules/auth/token.service";

export const SWAGGER_ROUTE_PREFIX = "/docs";

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: "Portfolio API",
      description: "Stateless portfolio API with OAuth2 + HttpOnly JWT cookie authentication and controlled resume PDF delivery.",
      version: "1.0.0",
    },
    tags: [
      { name: "Health", description: "Service availability and health probes." },
      { name: "Auth", description: "Stateless OAuth2 authentication and JWT session management." },
      { name: "Resume", description: "Authenticated resume PDF delivery and daily access code generation." },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: SESSION_COOKIE_NAME,
          description: `Stateless JWT session token stored in the "${SESSION_COOKIE_NAME}" HttpOnly cookie.`,
        },
      },
    },
  },
  transform: createJsonSchemaTransform({
    skipList: [
      SWAGGER_ROUTE_PREFIX,
      `${SWAGGER_ROUTE_PREFIX}/`,
      `${SWAGGER_ROUTE_PREFIX}/json`,
      `${SWAGGER_ROUTE_PREFIX}/yaml`,
      `${SWAGGER_ROUTE_PREFIX}/static/*`,
    ],
  }),
  transformObject: jsonSchemaTransformObject,
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: SWAGGER_ROUTE_PREFIX,
  uiConfig: {
    docExpansion: "list",
    deepLinking: true,
  },
};
