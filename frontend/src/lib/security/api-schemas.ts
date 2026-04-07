import { z } from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const friendRequestPayloadSchema = z.object({
  action: z.literal("request"),
  email: z.string().trim().email().max(254),
});

export const friendRespondPayloadSchema = z.object({
  requestId: z.string().trim().min(1).max(128),
  action: z.enum(["accept", "decline"]),
});

export const createCommunityPostPayloadSchema = z.object({
  content: z.string().trim().min(3).max(1200),
  mediaUrl: z.string().trim().url().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(24)).max(6).optional(),
  milestone: z.boolean().optional(),
});

export const createCommentPayloadSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

export const routeIdParamSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

export const createChallengePayloadSchema = z
  .object({
    title: z.string().trim().min(3).max(80),
    description: z.string().trim().max(320).optional(),
    metricType: z.enum(["steps", "activeMinutes", "waterMl"]),
    targetValue: z.coerce.number().finite().positive().max(1_000_000),
    startDate: z.string().regex(isoDatePattern, "startDate must be YYYY-MM-DD"),
    endDate: z.string().regex(isoDatePattern, "endDate must be YYYY-MM-DD"),
    inviteUids: z.array(z.string().trim().min(1).max(128)).max(20).optional(),
  })
  .refine((payload) => payload.endDate >= payload.startDate, {
    path: ["endDate"],
    message: "endDate must be on or after startDate",
  });

export function firstSchemaError(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) {
    return "Invalid request payload.";
  }

  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
