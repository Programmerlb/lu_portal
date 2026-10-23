import { z } from "zod";
import { optionalTrimmed, trimmedString, uuidSchema } from "./common";

export const ANNOUNCEMENT_CATEGORIES = [
  "official", "doctor", "representative", "majles_tolab", "urgent", "course",
] as const;
export const ANNOUNCEMENT_PRIORITIES = ["normal", "high", "urgent"] as const;
export const ANNOUNCEMENT_TARGETS = ["program", "course", "all"] as const;
export const ANNOUNCEMENT_STATUSES = ["draft", "published"] as const;

const boolFromForm = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const createAnnouncementSchema = z.object({
  category: z.enum(ANNOUNCEMENT_CATEGORIES),
  title: trimmedString(3, 200),
  body: trimmedString(3, 10000),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES).default("normal"),
  target_audience: z.enum(ANNOUNCEMENT_TARGETS).default("program"),
  course_id: uuidSchema.optional(),
  source_name: optionalTrimmed(200),
  source_url: z.string().trim().url().optional().or(z.literal("").transform(() => undefined)),
  requires_acknowledgment: boolFromForm,
  is_pinned: boolFromForm,
  expires_at: z.string().datetime({ offset: true }).optional().or(z.literal("").transform(() => undefined)),
  status: z.enum(ANNOUNCEMENT_STATUSES).default("draft"),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
