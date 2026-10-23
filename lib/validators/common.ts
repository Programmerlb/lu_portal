import { z } from "zod";

export const uuidSchema = z.string().uuid("Must be a valid UUID");
export const trimmedString = (min = 1, max = 500) => z.string().trim().min(min).max(max);
export const optionalTrimmed = (max = 2000) =>
  z.string().trim().max(max).optional().transform((v) => (v === "" ? undefined : v));
