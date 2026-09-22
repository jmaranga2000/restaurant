import { requireSession } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { isOrgWideAccess, loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { InventoryItemModel } from "@/models/InventoryItem";
import { ProductModel } from "@/models/Product";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { RecipeEditor } from "./RecipeEditor";

export default async function RecipesPage() {
  const ctx = await loadAuthContext(await requireSession());
  requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS, PERMISSIONS.INVENTORY_VIEW);
  if (!ctx.activeBranchId) return <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Menu · Inventory" title="Choose a branch first" description="Recipes use the ingredients stocked at the active branch." actions={<Button href="/workspace">Back to workspace</Button>} /><div className="mt-6"><EmptyState icon="⌘" title="No active branch selected" description="Select a branch before connecting menu items to stock ingredients." action={<Button href="/workspace">Open workspace</Button>} /></div></div>;
  requireBranchAccess(ctx, ctx.activeBranchId);
  await connectToDatabase();
  const [products, ingredients] = await Promise.all([
    ProductModel.find({ organizationId: ctx.organizationId, isActive: true }).select("name recipe").sort({ name: 1 }).lean(),
    InventoryItemModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).select("name unit averageUnitCostMinor").sort({ name: 1 }).lean(),
  ]);
  const recipeCount = products.filter((product) => product.recipe.length).length;
  return <main className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper"><div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Menu · Inventory" title="Recipes" description="Connect menu items to stock ingredients so preparation can consume inventory and reveal food cost." actions={<Button href="/inventory">View stock</Button>} /><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-ink-line/15 bg-white p-4 dark:border-ink-line dark:bg-ink-soft"><p className="text-xs text-ink/50 dark:text-paper/55">Menu items</p><p className="mt-2 font-display text-2xl">{products.length}</p></div><div className="rounded-xl border border-ink-line/15 bg-white p-4 dark:border-ink-line dark:bg-ink-soft"><p className="text-xs text-ink/50 dark:text-paper/55">Recipes configured</p><p className="mt-2 font-display text-2xl">{recipeCount}</p></div><div className="rounded-xl border border-ink-line/15 bg-white p-4 dark:border-ink-line dark:bg-ink-soft"><p className="text-xs text-ink/50 dark:text-paper/55">Branch ingredients</p><p className="mt-2 font-display text-2xl">{ingredients.length}</p></div></div><section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><RecipeEditor branchId={ctx.activeBranchId} products={products.map((product) => ({ id: String(product._id), name: product.name, recipe: product.recipe.map((line) => ({ inventoryItemId: String(line.inventoryItemId), quantity: line.quantity, unit: line.unit })) }))} ingredients={ingredients.map((item) => ({ id: String(item._id), name: item.name, unit: item.unit, averageUnitCostMinor: item.averageUnitCostMinor }))} /><div className="space-y-5"><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-900 dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-100"><p className="font-semibold">How recipes affect stock</p><p className="mt-2 leading-6">When a kitchen ticket starts preparing, the configured ingredient quantities are recorded as sale consumption in the stock ledger.</p></div><div className="rounded-xl border border-ink-line/15 bg-white p-5 dark:border-ink-line dark:bg-ink-soft"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Needs attention</p><p className="mt-2 text-sm leading-6 text-ink/60 dark:text-paper/65">{products.length - recipeCount} menu item{products.length - recipeCount === 1 ? "" : "s"} still need a recipe.</p></div></div></section></div></main>;
}