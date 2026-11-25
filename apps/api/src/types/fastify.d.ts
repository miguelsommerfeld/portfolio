import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from "fastify";
import type { ZodTypeProvider } from "@fastify/type-provider-zod";
import type { UserPayload } from "@shared/schemas/jwt.schema";
import type { AuthService } from "@/modules/auth/auth.service";
import type { TokenService } from "@/modules/auth/token.service";
import type { ResumeService } from "@/modules/resume/resume.service";

export type FastifyTypedInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>;

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: UserPayload;
    user: UserPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authService: AuthService;
    tokenService: TokenService;
    resumeService: ResumeService;
  }
}
