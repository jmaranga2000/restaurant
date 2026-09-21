"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInventoryItemAction } from "@/actions/inventory.actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function InventoryItemForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createInventoryItemAction(formData);
      if (!result.ok) {
        setNotice({ kind: "error", message: result.error.message });
        return;
      }
      formRef.current?.reset();
      setNotice({ kind: "success", message: "Ingredient added to this branch." });
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">New stock item</p>
      <h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Add an ingredient</h2>
      <p className="mt-2 text-sm leading-6 text-ink/55 dark:text-paper/60">Create the ingredient first, then use the ledger to record its opening balance or adjustments.</p>

      <form ref={formRef} action={submit} className="mt-5 space-y-3">
        <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">
          Ingredient name
          <Input name="name" required placeholder="Chicken breast" className="mt-1.5" />
        </label>
        <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">
          Stock unit
          <select name="unit" required defaultValue="unit" className="inventory-input mt-1.5">
            <option value="g">Grams (g)</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="ml">Millilitres (ml)</option>
            <option value="l">Litres (l)</option>
            <option value="unit">Units</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">
            Minimum stock
            <Input name="minimumStock" type="number" min="0" step="any" defaultValue="0" className="mt-1.5" />
          </label>
          <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">
            Reorder at
            <Input name="reorderLevel" type="number" min="0" step="any" defaultValue="0" className="mt-1.5" />
          </label>
        </div>
        {notice ? <p className={`rounded-lg px-3 py-2 text-xs ${notice.kind === "error" ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-100" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100"}`}>{notice.message}</p> : null}
        <Button type="submit" disabled={isPending} className="w-full">{isPending ? "Adding ingredient…" : "Add ingredient"}</Button>
      </form>
    </Card>
  );
}
