"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordManualMovementAction } from "@/actions/inventory.actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatMoney, formatQuantity } from "@/app/inventory/inventory-helpers";

type WasteItem = { id: string; name: string; unit: string; quantityOnHand: number; averageUnitCostMinor: number };

export function WasteForm({ branchId, items }: { branchId: string; items: WasteItem[] }) {
  const router = useRouter();
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedItem = items.find((item) => item.id === itemId);
  const quantityValue = Number(quantity);
  const estimatedCostMinor = selectedItem && Number.isFinite(quantityValue) ? Math.round(Math.max(0, quantityValue) * selectedItem.averageUnitCostMinor) : 0;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const result = await recordManualMovementAction({ branchId, inventoryItemId: itemId, type: "WASTE", quantity: -Math.abs(quantityValue), note: note || undefined });
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error.message });
        return;
      }
      setQuantity("");
      setNote("");
      setStatus({ kind: "success", message: "Waste recorded and stock ledger updated." });
      router.refresh();
    });
  }

  return <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Record waste</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Remove spoiled or unusable stock</h2><p className="mt-2 text-sm leading-6 text-ink/55 dark:text-paper/60">The quantity is removed from stock and valued using the ingredient’s average unit cost.</p><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-xs font-medium text-ink/65 dark:text-paper/70">Ingredient<select value={itemId} onChange={(event) => setItemId(event.target.value)} className="inventory-input mt-1.5" required disabled={!items.length}><option value="">Select an ingredient</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatQuantity(item.quantityOnHand)} {item.unit}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-medium text-ink/65 dark:text-paper/70">Quantity wasted<Input type="number" min="0.01" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" required disabled={!items.length} className="mt-1.5" /></label><div className="rounded-lg bg-paper-dim px-3 py-2.5 dark:bg-ink"><p className="text-xs text-ink/50 dark:text-paper/55">Estimated cost</p><p className="mt-1 font-display text-lg text-ink dark:text-paper">{formatMoney(estimatedCostMinor)}</p><p className="text-[11px] text-ink/45 dark:text-paper/50">Based on {formatMoney(selectedItem?.averageUnitCostMinor ?? 0)} per {selectedItem?.unit ?? "unit"}</p></div></div><label className="block text-xs font-medium text-ink/65 dark:text-paper/70">Reason <span className="font-normal text-ink/40 dark:text-paper/45">(optional)</span><Input value={note} onChange={(event) => setNote(event.target.value)} maxLength={280} placeholder="Spoiled, damaged, expired, preparation loss" className="mt-1.5" disabled={!items.length} /></label>{status ? <p className={`rounded-lg px-3 py-2 text-xs ${status.kind === "error" ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-100" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100"}`}>{status.message}</p> : null}<Button type="submit" disabled={!items.length || isPending} className="w-full">{isPending ? "Recording waste…" : "Record waste"}</Button></form></Card>;
}