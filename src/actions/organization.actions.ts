"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { OrganizationService } from "@/services/organization.service";
import { updateOrganizationSettingsSchema } from "@/validations/organization.schema";
import { toClientError } from "@/lib/errors";
import type { ActionResult } from "@/actions/auth.actions";

export async function updateOrganizationSettingsAction(formData: FormData): Promise<ActionResult<{ ok: true }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);

    const taxRatePercent = formData.get("taxRatePercent");
    const serviceChargePercent = formData.get("serviceChargePercent");

    const parsed = updateOrganizationSettingsSchema.parse({
      name: formData.get("name") || undefined,
      defaultCurrency: formData.get("defaultCurrency") || undefined,
      defaultTimezone: formData.get("defaultTimezone") || undefined,
      taxRatePercent: taxRatePercent ? Number(taxRatePercent) : undefined,
      serviceChargePercent: serviceChargePercent ? Number(serviceChargePercent) : undefined,
    });

    await OrganizationService.updateSettings(ctx, parsed);
    revalidatePath("/admin/settings");
    return { ok: true, data: { ok: true } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}
