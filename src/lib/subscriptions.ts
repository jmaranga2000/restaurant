export const SUBSCRIPTION_PLANS = {
  TRIAL: {
    label: "Trial",
    monthlyMinor: 0,
    description: "Explore core restaurant operations before committing.",
    features: ["Single branch", "POS and orders", "Kitchen display", "Menu management"],
  },
  STARTER: {
    label: "Starter",
    monthlyMinor: 4_500_00,
    description: "For one location ready to run service every day.",
    features: ["Everything in Trial", "Customer profiles", "Payment reconciliation", "Email support"],
  },
  PROFESSIONAL: {
    label: "Professional",
    monthlyMinor: 9_500_00,
    description: "For growing restaurants with deeper operational needs.",
    features: ["Multiple branches", "Inventory and purchasing", "Loyalty and reports", "Digital signage"],
  },
  ENTERPRISE: {
    label: "Enterprise",
    monthlyMinor: 25_000_00,
    description: "For multi-location groups that need tailored support.",
    features: ["Everything in Professional", "Custom integrations", "Priority support", "Enterprise rollout support"],
  },
} as const;

export type SubscriptionPlanCode = keyof typeof SUBSCRIPTION_PLANS;
export type PaidSubscriptionPlanCode = Exclude<SubscriptionPlanCode, "TRIAL">;

export const PAID_SUBSCRIPTION_PLANS: PaidSubscriptionPlanCode[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];

export function formatPlanMoney(minor: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}
