import { PageHeading } from "@/components/ui/PageHeading";
import { requirePlatformSession } from "@/lib/platform-session";
import { PlatformPlanService } from "@/services/platform-plan.service";
import { PlanEditor } from "./PlanEditor";

export default async function SuperAdminPlansPage() {
  await requirePlatformSession();
  const plans = await PlatformPlanService.getCatalog();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading eyebrow="Billing · Catalog" title="Plans" description="Edit plan names, monthly prices, descriptions, and feature lists offered to restaurant organizations." />
        <PlanEditor plans={plans} />
        <p className="mt-5 border-l-2 border-amber-400 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">Saved prices apply to new subscription requests. Existing subscriptions and already-submitted payment requests keep their recorded amounts.</p>
      </div>
    </div>
  );
}