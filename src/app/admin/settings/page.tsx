import { updateOrganizationSettingsAction } from "@/actions/organization.actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { OrganizationService } from "@/services/organization.service";

const labelStyle = "mb-1.5 block text-xs font-medium text-ink/60 dark:text-paper/65";

export default async function AdminSettingsPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  const organization = await OrganizationService.getForAdmin(ctx);

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateOrganizationSettingsAction(formData);
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <PageHeading eyebrow="Restaurant administration" title="Organization settings" description="Keep the details and default financial settings for your restaurant up to date." />
      <Card className="mt-6 p-5 sm:p-6"><form action={handleUpdate} className="space-y-6"><section><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Organization profile</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Restaurant details</h2><div className="mt-5"><label htmlFor="name" className={labelStyle}>Organization name</label><Input id="name" name="name" defaultValue={organization.name} /></div></section><section className="border-t border-ink-line/15 pt-6 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Regional defaults</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label htmlFor="defaultCurrency" className={labelStyle}>Currency (ISO code)</label><Input id="defaultCurrency" name="defaultCurrency" defaultValue={organization.defaultCurrency} maxLength={3} className="uppercase" /></div><div><label htmlFor="defaultTimezone" className={labelStyle}>Timezone</label><Input id="defaultTimezone" name="defaultTimezone" defaultValue={organization.defaultTimezone} /></div></div></section><section className="border-t border-ink-line/15 pt-6 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Charges</p><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">These values are used as your restaurant’s defaults.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label htmlFor="taxRatePercent" className={labelStyle}>Tax rate (%)</label><Input id="taxRatePercent" name="taxRatePercent" type="number" step="0.01" min="0" max="100" defaultValue={organization.settings?.taxRatePercent ?? 0} /></div><div><label htmlFor="serviceChargePercent" className={labelStyle}>Service charge (%)</label><Input id="serviceChargePercent" name="serviceChargePercent" type="number" step="0.01" min="0" max="100" defaultValue={organization.settings?.serviceChargePercent ?? 0} /></div></div></section><div className="flex justify-end border-t border-ink-line/15 pt-5 dark:border-ink-line"><Button type="submit">Save changes</Button></div></form></Card>
    </div>
  );
}
