import {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault
} from 'fastify';
import { ZodTypeProvider } from '@fastify/type-provider-zod';
import { AuthService } from '@/modules/auth/auth.service';

export type FastifyTypedInstance = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    FastifyBaseLogger,
    ZodTypeProvider
  >

declare module 'fastify' {
  interface FastifyInstance {
      authService: AuthService
  }
}
