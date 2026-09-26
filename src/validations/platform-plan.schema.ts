import { z } from "zod";
import { SUBSCRIPTION_PLAN_CODES } from "@/lib/subscriptions";

export const updatePlatformPlanSchema = z.object({
  code: z.enum(SUBSCRIPTION_PLAN_CODES as [typeof SUBSCRIPTION_PLAN_CODES[number], ...typeof SUBSCRIPTION_PLAN_CODES[number][]]),
  label: z.string().trim().min(2).max(60),
  monthlyMinor: z.number().int().min(0).max(100_000_000),
  description: z.string().trim().min(2).max(300),
  features: z.array(z.string().trim().min(2).max(120)).min(1).max(12),
});

export type UpdatePlatformPlanInput = z.infer<typeof updatePlatformPlanSchema>;