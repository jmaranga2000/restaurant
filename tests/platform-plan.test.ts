import { describe, expect, it } from "vitest";
import { updatePlatformPlanSchema } from "@/validations/platform-plan.schema";

describe("platform plan updates", () => {
  it("accepts valid plan edits and trims text fields", () => {
    expect(updatePlatformPlanSchema.parse({
      code: "STARTER",
      label: " Starter ",
      monthlyMinor: 450000,
      description: " One location ",
      features: [" POS access ", "Reports"],
    })).toEqual({
      code: "STARTER",
      label: "Starter",
      monthlyMinor: 450000,
      description: "One location",
      features: ["POS access", "Reports"],
    });
  });

  it("rejects invalid plan codes, negative prices, and empty features", () => {
    const base = { code: "STARTER", label: "Starter", monthlyMinor: 1000, description: "A plan", features: ["POS"] };
    expect(updatePlatformPlanSchema.safeParse({ ...base, code: "CUSTOM" }).success).toBe(false);
    expect(updatePlatformPlanSchema.safeParse({ ...base, monthlyMinor: -1 }).success).toBe(false);
    expect(updatePlatformPlanSchema.safeParse({ ...base, features: [] }).success).toBe(false);
  });
});