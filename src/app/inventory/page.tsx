import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { InventoryService } from "@/services/inventory.service";
import { createInventoryItemAction } from "@/actions/inventory.actions";
import { MovementForm } from "./MovementForm";

export default async function InventoryPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);

  if (!ctx.activeBranchId) {
    return <div className="p-8 text-ink/70">Select a branch to see its inventory.</div>;
  }

  const items = await InventoryService.listForBranch(ctx, ctx.activeBranchId);

  const itemsForForm = items.map((i) => ({
    id: String(i._id),
    name: i.name,
    unit: i.unit,
    quantityOnHand: i.quantityOnHand,
  }));

  async function handleCreate(formData: FormData) {
    "use server";
    await createInventoryItemAction(formData);
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-display text-2xl mb-6">Inventory</h1>

      <table className="w-full text-sm border-collapse mb-8">
        <thead>
          <tr className="text-left text-ink/50 border-b border-ink-line/20">
            <th className="py-2 font-normal">Item</th>
            <th className="py-2 font-normal">On hand</th>
            <th className="py-2 font-normal">Reorder level</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const low = item.quantityOnHand <= item.reorderLevel;
            return (
              <tr key={String(item._id)} className="border-b border-ink-line/10">
                <td className="py-3">{item.name}</td>
                <td className={`py-3 tabular-nums ${low ? "text-status-cancelled font-medium" : ""}`}>
                  {item.quantityOnHand} {item.unit}
                  {low && " · low"}
                </td>
                <td className="py-3 tabular-nums text-ink/50">
                  {item.reorderLevel} {item.unit}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-ink/40">
                No inventory items yet — add one below.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-6">
        <div className="border border-ink-line/20 rounded-lg p-5 bg-white">
          <h2 className="font-medium mb-4">Add an item</h2>
          <form action={handleCreate} className="space-y-3">
            <input name="name" required placeholder="Ingredient name" className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm" />
            <select name="unit" required className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm">
              <option value="g">grams (g)</option>
              <option value="kg">kilograms (kg)</option>
              <option value="ml">millilitres (ml)</option>
              <option value="l">litres (l)</option>
              <option value="unit">units</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input name="minimumStock" type="number" min="0" placeholder="Minimum stock" className="border border-ink-line/30 rounded px-3 py-2 text-sm" />
              <input name="reorderLevel" type="number" min="0" placeholder="Reorder level" className="border border-ink-line/30 rounded px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="w-full bg-ember hover:bg-ember-dark text-white rounded py-2 text-sm font-medium">
              Add item
            </button>
          </form>
        </div>

        <MovementForm branchId={ctx.activeBranchId} items={itemsForForm} />
      </div>
    </div>
  );
}
