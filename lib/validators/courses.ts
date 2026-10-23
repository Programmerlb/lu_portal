import { z } from "zod";
import { optionalTrimmed, trimmedString, uuidSchema } from "./common";

export const createCourseSchema = z.object({
  semester_id: uuidSchema,
  code: z.string().trim().min(2).max(20).regex(/^[A-Z0-9-]+$/, "Use uppercase letters, digits and dashes"),
  name_en: trimmedString(2, 200),
  name_ar: optionalTrimmed(200),
  description: optionalTrimmed(4000),
  credits: z.coerce.number().int().min(1).max(30).optional(),
  doctor_ids: z.array(uuidSchema).max(10).default([]),
});

export const updateCourseSchema = createCourseSchema.partial().extend({ id: uuidSchema });

export const archiveCourseSchema = z.object({
  id: uuidSchema,
  is_archived: z.union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((v) => v === true || v === "true"),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
