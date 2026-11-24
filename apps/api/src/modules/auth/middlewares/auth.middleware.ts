import type { FastifyReply, FastifyRequest } from "fastify";
import { userPayloadSchema } from "@shared/schemas/jwt.schema";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const decoded = await request.jwtVerify({ onlyCookie: true });
    const parsed = userPayloadSchema.safeParse(decoded);

    if (!parsed.success) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "Invalid authentication token payload.",
      });
    }

    request.user = parsed.data;
  } catch {
    return reply.status(401).send({
      error: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }
}
