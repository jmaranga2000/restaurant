"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordManualMovementAction } from "@/actions/inventory.actions";
import { MANUAL_MOVEMENT_TYPES } from "@/validations/inventory.schema";

interface Item {
  id: string;
  name: string;
  unit: string;
  quantityOnHand: number;
}

export function MovementForm({ branchId, items }: { branchId: string; items: Item[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<{ kind: "idle" | "error" | "success"; message?: string }>({ kind: "idle" });

  async function handleSubmit(formData: FormData) {
    const type = String(formData.get("type"));
    const rawQuantity = Number(formData.get("quantity"));
    // WASTE always reduces stock; the operator enters a positive count.
    const quantity = type === "WASTE" ? -Math.abs(rawQuantity) : rawQuantity;

    const result = await recordManualMovementAction({
      branchId,
      inventoryItemId: formData.get("inventoryItemId"),
      type,
      quantity,
      note: formData.get("note") || undefined,
    });

    if (result.ok) {
      setStatus({ kind: "success", message: "Recorded." });
      router.refresh();
    } else {
      setStatus({ kind: "error", message: result.error.message });
    }
  }

  return (
    <div className="border border-ink-line/20 rounded-lg p-5 bg-white">
      <h2 className="font-medium mb-4">Record a movement</h2>
      <form action={handleSubmit} className="space-y-3">
        <select name="inventoryItemId" required className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm">
          <option value="">Select an item…</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.quantityOnHand} {item.unit} on hand)
            </option>
          ))}
        </select>
        <select name="type" required className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm">
          {MANUAL_MOVEMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          name="quantity"
          type="number"
          step="any"
          required
          placeholder="Quantity"
          className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm"
        />
        <input name="note" placeholder="Note (optional)" className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm" />
        {status.kind === "error" && <p className="text-sm text-status-cancelled">{status.message}</p>}
        {status.kind === "success" && <p className="text-sm text-status-ready">{status.message}</p>}
        <button type="submit" className="w-full bg-ink hover:bg-ink-soft text-white rounded py-2 text-sm font-medium">
          Record movement
        </button>
      </form>
    </div>
  );
}
