"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { OrganizationModel } from "@/models/Organization";
import { NotFoundError, ValidationError, toClientError } from "@/lib/errors";
import type { ActionResult } from "@/actions/auth.actions";

export async function saveKitchenSettingsAction(formData: FormData): Promise<ActionResult<{ ok: true }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
    const stations = String(formData.get("stations") ?? "").split(/[\n,]/).map((station) => station.trim()).filter(Boolean);
    if (!stations.length) throw new ValidationError("Add at least one kitchen station.");
    if (stations.length > 20 || stations.some((station) => station.length > 80)) throw new ValidationError("Use up to 20 station names, each under 80 characters.");
    const delayAlertMinutes = Number(formData.get("delayAlertMinutes"));
    if (!Number.isInteger(delayAlertMinutes) || delayAlertMinutes < 1 || delayAlertMinutes > 180) throw new ValidationError("Set a delay alert between 1 and 180 minutes.");
    const organization = await OrganizationModel.findById(ctx.organizationId);
    if (!organization) throw new NotFoundError("Organization");
    organization.set("settings.kitchenStations", Array.from(new Set(stations)));
    organization.set("settings.kitchenDelayAlertMinutes", delayAlertMinutes);
    organization.set("settings.kitchenSoundEnabled", formData.get("soundEnabled") === "on");
    organization.set("settings.kitchenNotificationsEnabled", formData.get("notificationsEnabled") === "on");
    organization.set("settings.kitchenDisplayDensity", formData.get("displayDensity") === "COMPACT" ? "COMPACT" : "COMFORTABLE");
    await organization.save();
    revalidatePath("/kitchen", "layout");
    return { ok: true, data: { ok: true } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}
