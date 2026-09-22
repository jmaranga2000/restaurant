"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordManualMovementAction } from "@/actions/inventory.actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MANUAL_MOVEMENT_TYPES } from "@/validations/inventory.schema";

interface Item {
  id: string;
  name: string;
  unit: string;
  quantityOnHand: number;
}

const movementCopy: Record<(typeof MANUAL_MOVEMENT_TYPES)[number], string> = {
  ADJUSTMENT: "Increase or decrease stock after a count.",
  WASTE: "Records a positive amount as stock out.",
  OPENING_BALANCE: "Sets the starting stock through the ledger.",
  RETURN: "Records stock returned to the branch.",
};

export function MovementForm({
  branchId,
  items,
  initialType = "ADJUSTMENT",
}: {
  branchId: string;
  items: Item[];
  initialType?: (typeof MANUAL_MOVEMENT_TYPES)[number];
}) {
  const router = useRouter();
  const [type, setType] = useState<(typeof MANUAL_MOVEMENT_TYPES)[number]>(initialType);
  const [status, setStatus] = useState<{ kind: "idle" | "error" | "success"; message?: string }>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const rawQuantity = Number(formData.get("quantity"));
      const quantity = type === "WASTE" ? -Math.abs(rawQuantity) : rawQuantity;
      const result = await recordManualMovementAction({
        branchId,
        inventoryItemId: formData.get("inventoryItemId"),
        type,
        quantity,
        note: formData.get("note") || undefined,
      });

      if (!result.ok) {
        setStatus({ kind: "error", message: result.error.message });
        return;
      }
      setStatus({ kind: "success", message: "Stock ledger updated." });
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Stock ledger</p>
      <h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Record movement</h2>
      <p className="mt-2 text-sm leading-6 text-ink/55 dark:text-paper/60">Every update creates a permanent, auditable stock movement.</p>

      <form action={submit} className="mt-5 space-y-3">
        <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">
          Ingredient
          <select name="inventoryItemId" required className="inventory-input mt-1.5" disabled={!items.length}>
            <option value="">{items.length ? "Select an ingredient" : "Add an ingredient first"}</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantityOnHand} {item.unit}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">
          Movement type
          <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="inventory-input mt-1.5">
            {MANUAL_MOVEMENT_TYPES.map((entry) => <option key={entry} value={entry}>{entry.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <p className="-mt-1 text-[11px] leading-5 text-ink/45 dark:text-paper/50">{movementCopy[type]}</p>
        <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">
          Quantity {type === "WASTE" ? "to remove" : "change"}
          <Input name="quantity" type="number" step="any" required placeholder={type === "ADJUSTMENT" ? "Use a negative number to reduce" : "0"} className="mt-1.5" disabled={!items.length} />
        </label>
        <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">
          Note <span className="font-normal text-ink/40 dark:text-paper/45">(optional)</span>
          <Input name="note" maxLength={280} placeholder="Reason or count reference" className="mt-1.5" disabled={!items.length} />
        </label>
        {status.kind !== "idle" ? <p className={`rounded-lg px-3 py-2 text-xs ${status.kind === "error" ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-100" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100"}`}>{status.message}</p> : null}
        <Button type="submit" variant="secondary" disabled={!items.length || isPending} className="w-full">{isPending ? "Recording movement…" : "Record movement"}</Button>
      </form>
    </Card>
  );
}
