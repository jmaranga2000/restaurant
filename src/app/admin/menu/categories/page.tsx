import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { connectToDatabase } from "@/lib/db";
import { CategoryModel } from "@/models/Product";

export default async function MenuCategoriesPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
  await connectToDatabase();
  const categories = await CategoryModel.find({ organizationId: ctx.organizationId, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Menu studio" title="Categories" description="Organize the menu into clear sections for cashiers and guests." actions={<Button href="/admin/menu/categories/new">New category</Button>} /><Card className="mt-6 overflow-hidden">{categories.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{categories.map((category) => <div key={String(category._id)} className="flex items-center gap-4 px-5 py-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">□</span><div className="min-w-0 flex-1"><b className="block text-sm text-ink dark:text-paper">{category.name}</b><small className="text-xs text-ink/50 dark:text-paper/55">Position {category.sortOrder + 1}</small></div></div>)}</div> : <div className="p-5"><EmptyState icon="□" title="No categories yet" description="Create your first category before adding menu items." action={<Button href="/admin/menu/categories/new">New category</Button>} /></div>}</Card></div>;
}