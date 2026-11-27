import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";
import type { FastifyTypedInstance } from "@/types/fastify";

const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export const healthRoutes: FastifyPluginAsyncZod = async function (server: FastifyTypedInstance) {
  server.get("/", {
    config: {
      rateLimit: false,
    },
    schema: {
      tags: ["Health"],
      summary: "Health check",
      description: "Returns service availability status for container and platform health probes.",
      response: {
        200: healthResponseSchema.describe("Service is healthy."),
      },
    },
    handler: async (_request, reply) => {
      return reply.status(200).header("Cache-Control", "no-store").send({ status: "ok" });
    },
  });
};
