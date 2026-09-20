import { z } from "zod";

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24h HH:MM.");

export const createBranchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only."),
  address: z.string().trim().max(240).optional(),
  timezone: z.string().trim().max(64).optional(),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema.partial().extend({
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  isActive: z.boolean().optional(),
});
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export const openingHoursSchema = z.object({
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  hours: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      opensAt: timeString,
      closesAt: timeString,
    })
  ),
});
