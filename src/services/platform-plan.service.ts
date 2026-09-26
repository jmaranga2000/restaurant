import "server-only";
import { connectToDatabase } from "@/lib/db";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLAN_CODES,
  type SubscriptionPlanCatalog,
  type SubscriptionPlanCode,
} from "@/lib/subscriptions";
import { PlatformPlanCatalogModel } from "@/models/PlatformPlanCatalog";
import type { UpdatePlatformPlanInput } from "@/validations/platform-plan.schema";

export const PlatformPlanService = {
  async getCatalog(): Promise<SubscriptionPlanCatalog> {
    await connectToDatabase();
    const saved = await PlatformPlanCatalogModel.findOne({ key: "default" }).lean();
    const catalog = Object.fromEntries(
      SUBSCRIPTION_PLAN_CODES.map((code) => [code, { ...DEFAULT_SUBSCRIPTION_PLANS[code], features: [...DEFAULT_SUBSCRIPTION_PLANS[code].features] }])
    ) as SubscriptionPlanCatalog;

    for (const plan of saved?.plans ?? []) {
      catalog[plan.code as SubscriptionPlanCode] = {
        label: plan.label,
        monthlyMinor: plan.monthlyMinor,
        description: plan.description,
        features: plan.features,
      };
    }
    return catalog;
  },

  async updatePlan(input: UpdatePlatformPlanInput) {
    await connectToDatabase();
    const current = await PlatformPlanCatalogModel.findOne({ key: "default" }).lean();
    const catalog = Object.fromEntries(
      SUBSCRIPTION_PLAN_CODES.map((code) => [code, { ...DEFAULT_SUBSCRIPTION_PLANS[code], features: [...DEFAULT_SUBSCRIPTION_PLANS[code].features] }])
    ) as SubscriptionPlanCatalog;
    for (const plan of current?.plans ?? []) {
      catalog[plan.code as SubscriptionPlanCode] = {
        label: plan.label,
        monthlyMinor: plan.monthlyMinor,
        description: plan.description,
        features: plan.features,
      };
    }
    catalog[input.code] = {
      label: input.label,
      monthlyMinor: input.monthlyMinor,
      description: input.description,
      features: input.features,
    };

    const plans = SUBSCRIPTION_PLAN_CODES.map((code) => ({ code, ...catalog[code] }));
    await PlatformPlanCatalogModel.findOneAndUpdate(
      { key: "default" },
      { $set: { plans } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return catalog[input.code];
  },
};