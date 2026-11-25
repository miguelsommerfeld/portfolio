import { z } from "zod";

export const resumeHeadersSchema = z.looseObject({
  "x-resume-code": z.string().trim().optional().describe("Optional daily access code (XXXX-XXXX) required to download the full resume variant. Omit to receive the censored variant."),
});

export const resumePdfResponseSchema = z.unknown().meta({
  content: {
    "application/pdf": {
      schema: {
        type: "string",
        format: "binary",
      },
    },
  },
  headers: {
    "Content-Disposition": {
      type: "string",
      description: "Inline disposition header containing the served PDF filename.",
    },
    "Cache-Control": {
      type: "string",
      description: "Always \"no-store\" to prevent caching of the resume document.",
    },
    "X-Resume-Variant": {
      type: "string",
      enum: ["censored", "full"],
      description: "Indicates which resume variant was returned.",
    },
  },
}).describe("Resume PDF binary stream.");

export const resumeCodeResponseSchema = z.object({
  code: z.string().describe("Daily access code in XXXX-XXXX format to be sent in the x-resume-code header."),
  validForDate: z.string().describe("Calendar date (YYYY-MM-DD) in the configured resume time zone for which this code is valid."),
  expiresAt: z.iso.datetime().describe("UTC ISO-8601 timestamp when the daily code expires."),
});

export const resumeErrorResponseSchema = z.object({
  error: z.string().describe("Machine-readable error code."),
  message: z.string().describe("Human-readable error description."),
});

export type ResumeCodeResponse = z.infer<typeof resumeCodeResponseSchema>;
