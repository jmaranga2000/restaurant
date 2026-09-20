import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { OrganizationModel } from "@/models/Organization";
import { KitchenSettingsForm } from "./KitchenSettingsForm";

export default async function KitchenSettingsPage() {
  const session = await requireSession(); const ctx = await loadAuthContext(session); requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
  const organization = await OrganizationModel.findById(ctx.organizationId).select("settings").lean();
  return <KitchenSettingsForm initial={{
    stations: organization?.settings?.kitchenStations?.filter(Boolean) ?? ["Kitchen"],
    delayAlertMinutes: organization?.settings?.kitchenDelayAlertMinutes ?? 15,
    soundEnabled: organization?.settings?.kitchenSoundEnabled ?? true,
    notificationsEnabled: organization?.settings?.kitchenNotificationsEnabled ?? true,
    displayDensity: organization?.settings?.kitchenDisplayDensity ?? "COMFORTABLE",
  }} />;
}
