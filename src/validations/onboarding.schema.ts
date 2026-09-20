import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const onboardingSchema = z.object({
  restaurantName: z.string().trim().min(2, "Enter your restaurant name.").max(120),
  description: optionalText(600),
  phone: optionalText(40),
  email: z.string().trim().toLowerCase().email("Enter a valid restaurant email.").optional().or(z.literal("")),
  address: optionalText(240),
  city: optionalText(100),
  country: optionalText(100),
  currency: z.string().trim().length(3, "Use a 3-letter currency code.").toUpperCase(),
  timezone: z.string().trim().min(2).max(64),
  taxRatePercent: z.coerce.number().min(0).max(100),
  serviceChargePercent: z.coerce.number().min(0).max(100),
  taxLabel: optionalText(32),
  pricesIncludeTax: z.boolean().optional(),
  receiptHeader: optionalText(240),
  receiptFooter: optionalText(500),
  receiptPrefix: optionalText(24),
  legalName: optionalText(160),
  registrationNumber: optionalText(80),
  taxNumber: optionalText(80),
  branchName: z.string().trim().min(2, "Enter a branch name.").max(120),
  branchCode: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only."),
  branchAddress: optionalText(240),
  branchPhone: optionalText(40),
  opensAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, for example 08:00."),
  closesAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, for example 22:00."),
  tableCount: z.coerce.number().int().min(0).max(100),
  serviceTypes: z.array(z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY", "PICKUP"])).min(1, "Select at least one service type."),
  paymentMethods: z.array(z.enum(["CASH", "MPESA", "CARD", "BANK", "OTHER"])),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const onboardingDraftSchema = onboardingSchema.partial().extend({
  restaurantName: z.string().trim().max(120).optional(),
  currency: z.string().trim().max(3).optional(),
  timezone: z.string().trim().max(64).optional(),
});
