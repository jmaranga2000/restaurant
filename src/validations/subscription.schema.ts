import { z } from "zod";

export const createSubscriptionRequestSchema = z.object({
  plan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]),
  paymentMethod: z.enum(["MPESA", "CARD", "BANK"]),
  billingEmail: z.string().trim().toLowerCase().email("Enter a valid billing email address."),
  mpesaPhone: z.string().trim().min(7).max(40).optional().or(z.literal("")),
}).superRefine((value, context) => {
  if (value.paymentMethod === "MPESA" && !value.mpesaPhone) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["mpesaPhone"], message: "Enter the M-Pesa number that should receive the payment prompt." });
  }
});

export type CreateSubscriptionRequestInput = z.infer<typeof createSubscriptionRequestSchema>;
