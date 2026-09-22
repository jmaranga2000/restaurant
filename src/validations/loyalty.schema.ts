import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid customer id.");

export const createLoyaltyCustomerSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer's name.").max(120),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").optional().or(z.literal("")),
}).refine((value) => Boolean(value.phone || value.email), "Add a phone number or email address so the member can be identified.");

export type CreateLoyaltyCustomerInput = z.infer<typeof createLoyaltyCustomerSchema>;

export const changeLoyaltyPointsSchema = z.object({
  customerId: objectId,
  type: z.enum(["EARN", "REDEEM"]),
  points: z.number().int().min(1, "Enter at least one point.").max(100_000),
  reason: z.string().trim().min(2, "Add a short reason.").max(180),
});

export type ChangeLoyaltyPointsInput = z.infer<typeof changeLoyaltyPointsSchema>;
