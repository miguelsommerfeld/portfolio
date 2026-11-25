import { createReadStream } from "node:fs";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import { authenticate } from "@/modules/auth/middlewares/auth.middleware";
import { resumeCodeResponseSchema, resumeErrorResponseSchema, resumeHeadersSchema, resumePdfResponseSchema } from "@/modules/resume/resume.schema";
import { ResumeError } from "@/modules/resume/resume.service";
import type { FastifyTypedInstance } from "@/types/fastify";

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
      tags: ["Resume"],
      summary: "Download resume PDF",
      description: "Streams the resume PDF inline. Returns the censored variant by default, or the full variant when a valid daily code is supplied via the x-resume-code header.",
      security: [{ cookieAuth: [] }],
      headers: resumeHeadersSchema,
      response: {
        200: resumePdfResponseSchema,
        401: resumeErrorResponseSchema.describe("Missing, expired, or invalid authentication cookie."),
        403: resumeErrorResponseSchema.describe("Provided x-resume-code header is invalid or expired."),
        503: resumeErrorResponseSchema.describe("Requested resume PDF file is currently unavailable."),
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
      tags: ["Resume"],
      summary: "Get daily resume access code",
      description: "Generates and returns the daily access code required to unlock the full resume variant. Restricted to configured owner email addresses.",
      security: [{ cookieAuth: [] }],
      response: {
        200: resumeCodeResponseSchema.meta({
          headers: {
            "Cache-Control": {
              type: "string",
              description: "Always \"no-store\" to prevent caching of the daily access code.",
            },
          },
        }).describe("Daily resume access code and expiration metadata."),
        401: resumeErrorResponseSchema.describe("Missing, expired, or invalid authentication cookie."),
        403: resumeErrorResponseSchema.describe("Authenticated user is not an authorized owner."),
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
