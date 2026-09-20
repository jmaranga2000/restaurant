import { z } from "zod";

export const updateOrganizationSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  defaultCurrency: z.string().trim().length(3).toUpperCase().optional(),
  defaultTimezone: z.string().trim().max(64).optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  serviceChargePercent: z.number().min(0).max(100).optional(),
});
export type UpdateOrganizationSettingsInput = z.infer<typeof updateOrganizationSettingsSchema>;
