import { describe, expect, it } from "vitest";
import { saveLoyaltyRewardSchema, setLoyaltyRewardActiveSchema } from "@/validations/loyalty-reward.schema";

describe("loyalty reward validation", () => {
  it("trims and accepts a valid reward", () => {
    expect(saveLoyaltyRewardSchema.parse({ name: "  Free coffee  ", description: "Any regular coffee", pointsRequired: 250 })).toEqual({
      name: "Free coffee",
      description: "Any regular coffee",
      pointsRequired: 250,
    });
  });

  it("rejects invalid reward points and names", () => {
    expect(saveLoyaltyRewardSchema.safeParse({ name: "x", pointsRequired: 0 }).success).toBe(false);
    expect(saveLoyaltyRewardSchema.safeParse({ name: "Meal", pointsRequired: 1.5 }).success).toBe(false);
  });

  it("validates reward activation updates", () => {
    expect(setLoyaltyRewardActiveSchema.safeParse({ rewardId: "507f1f77bcf86cd799439011", isActive: false }).success).toBe(true);
    expect(setLoyaltyRewardActiveSchema.safeParse({ rewardId: "invalid", isActive: false }).success).toBe(false);
  });
});