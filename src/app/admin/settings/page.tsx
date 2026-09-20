import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { OrganizationService } from "@/services/organization.service";
import { updateOrganizationSettingsAction } from "@/actions/organization.actions";

export default async function AdminSettingsPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  const org = await OrganizationService.getForAdmin(ctx);

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateOrganizationSettingsAction(formData);
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="font-display text-2xl mb-6">Organization settings</h1>
      <form action={handleUpdate} className="space-y-4 border border-ink-line/20 rounded-lg p-5 bg-white">
        <div>
          <label className="block text-xs text-ink/50 mb-1">Organization name</label>
          <input
            name="name"
            defaultValue={org.name}
            className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink/50 mb-1">Currency (ISO code)</label>
            <input
              name="defaultCurrency"
              defaultValue={org.defaultCurrency}
              maxLength={3}
              className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm uppercase"
            />
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1">Timezone</label>
            <input
              name="defaultTimezone"
              defaultValue={org.defaultTimezone}
              className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink/50 mb-1">Tax rate (%)</label>
            <input
              name="taxRatePercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={org.settings?.taxRatePercent ?? 0}
              className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1">Service charge (%)</label>
            <input
              name="serviceChargePercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={org.settings?.serviceChargePercent ?? 0}
              className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-ember hover:bg-ember-dark text-white rounded py-2 text-sm font-medium">
          Save changes
        </button>
      </form>
    </div>
  );
}
