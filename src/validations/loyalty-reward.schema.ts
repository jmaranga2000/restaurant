import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reward id.");

export const saveLoyaltyRewardSchema = z.object({
  name: z.string().trim().min(2, "Enter a reward name.").max(100),
  description: z.string().trim().max(240).optional(),
  pointsRequired: z.number().int().min(1, "A reward must require at least one point.").max(1_000_000),
});

export const setLoyaltyRewardActiveSchema = z.object({
  rewardId: objectId,
  isActive: z.boolean(),
});

export type SaveLoyaltyRewardInput = z.infer<typeof saveLoyaltyRewardSchema>;
export type SetLoyaltyRewardActiveInput = z.infer<typeof setLoyaltyRewardActiveSchema>;