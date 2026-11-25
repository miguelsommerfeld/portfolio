import { createReadStream } from "node:fs";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { z } from "zod";
import type { FastifyTypedInstance } from "@/types/fastify";
import { authenticate } from "@/modules/auth/middlewares/auth.middleware";
import { resumeCodeResponseSchema, resumeErrorResponseSchema, resumeHeadersSchema } from "@/modules/resume/resume.schema";
import { ResumeError } from "@/modules/resume/resume.service";

export const resumeRoutes: FastifyPluginAsyncZod = async function (server: FastifyTypedInstance) {
  server.get("/", {
    preHandler: [authenticate],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute",
      },
    },
    schema: {
      headers: resumeHeadersSchema,
      response: {
        200: z.unknown(),
        401: resumeErrorResponseSchema,
        403: resumeErrorResponseSchema,
        503: resumeErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const resumeFile = await server.resumeService.resolveResumeFile(request.headers["x-resume-code"]);

        return reply
          .status(200)
          .type("application/pdf")
          .header("Content-Disposition", `inline; filename="${resumeFile.filename}"`)
          .header("Cache-Control", "no-store")
          .header("X-Resume-Variant", resumeFile.variant)
          .send(createReadStream(resumeFile.filePath));
      } catch (err) {
        if (err instanceof ResumeError) {
          if (err.code === "INVALID_RESUME_CODE") {
            return reply.status(403).send({ error: err.code, message: err.message });
          }

          request.log.error({ err }, "Resume PDF file is unavailable");
          return reply.status(503).send({ error: err.code, message: err.message });
        }

        throw err;
      }
    },
  });

  server.get("/code", {
    preHandler: [authenticate],
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute",
      },
    },
    schema: {
      response: {
        200: resumeCodeResponseSchema,
        401: resumeErrorResponseSchema,
        403: resumeErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      if (!server.resumeService.isOwner(request.user)) {
        return reply.status(403).send({
          error: "FORBIDDEN",
          message: "You do not have permission to access the resume code.",
        });
      }

      return reply.status(200).header("Cache-Control", "no-store").send(server.resumeService.generateDailyCode());
    },
  });
};
