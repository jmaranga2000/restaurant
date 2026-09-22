import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { CategoryForm } from "./CategoryForm";

export default async function NewMenuCategoryPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
  return <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Menu studio" title="New category" description="Create a section that keeps the guest menu and cashier catalog easy to scan." /><CategoryForm /></div>;
}