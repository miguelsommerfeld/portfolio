import { z } from "zod";

export const resumeHeadersSchema = z.looseObject({
  "x-resume-code": z.string().trim().optional(),
});

export const resumeCodeResponseSchema = z.object({
  code: z.string(),
  validForDate: z.string(),
  expiresAt: z.iso.datetime(),
});

export const resumeErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export type ResumeCodeResponse = z.infer<typeof resumeCodeResponseSchema>;
