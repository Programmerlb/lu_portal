import { z } from "zod";
import { optionalTrimmed, trimmedString, uuidSchema } from "./common";

export const createLectureSchema = z.object({
  course_id: uuidSchema,
  title: trimmedString(2, 200),
  title_ar: optionalTrimmed(200),
  description: optionalTrimmed(4000),
  week_number: z.coerce.number().int().min(1).max(52).optional(),
  lecture_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional().or(z.literal("").transform(() => undefined)),
});

export type CreateLectureInput = z.infer<typeof createLectureSchema>;
