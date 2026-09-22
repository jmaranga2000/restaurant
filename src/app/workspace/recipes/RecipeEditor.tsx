"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProductRecipeAction } from "@/actions/menu.actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatMoney } from "@/app/inventory/inventory-helpers";

type Ingredient = { id: string; name: string; unit: string; averageUnitCostMinor: number };
type Product = { id: string; name: string; recipe: { inventoryItemId: string; quantity: number; unit: string }[] };

export function RecipeEditor({ branchId, products, ingredients }: { branchId: string; products: Product[]; ingredients: Ingredient[] }) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [lines, setLines] = useState<Product["recipe"]>(products[0]?.recipe ?? []);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectedProduct = products.find((product) => product.id === productId);
  const recipeCost = lines.reduce((total, line) => total + line.quantity * (ingredients.find((item) => item.id === line.inventoryItemId)?.averageUnitCostMinor ?? 0), 0);

  function selectProduct(value: string) {
    setProductId(value);
    setLines(products.find((product) => product.id === value)?.recipe ?? []);
    setStatus(null);
  }
  function addIngredient() {
    const available = ingredients.find((ingredient) => !lines.some((line) => line.inventoryItemId === ingredient.id));
    if (available) setLines((current) => [...current, { inventoryItemId: available.id, quantity: 1, unit: available.unit }]);
  }
  function updateLine(index: number, update: Partial<Product["recipe"][number]>) {
    setLines((current) => current.map((line, position) => position === index ? { ...line, ...update } : line));
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus(null); setError(false);
    startTransition(async () => {
      const result = await saveProductRecipeAction({ productId, branchId, lines });
      if (!result.ok) { setError(true); setStatus(result.error.message); return; }
      setStatus("Recipe saved. Inventory consumption will now use these ingredients.");
      router.refresh();
    });
  }

  return <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Recipe builder</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Ingredients per menu item</h2></div><div className="text-right"><p className="text-xs text-ink/50 dark:text-paper/55">Estimated recipe cost</p><p className="font-display text-lg text-ink dark:text-paper">{formatMoney(recipeCost)}</p></div></div><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-xs font-medium text-ink/65 dark:text-paper/70">Menu item<select value={productId} onChange={(event) => selectProduct(event.target.value)} className="inventory-input mt-1.5" required disabled={!products.length}><option value="">Select a menu item</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><div className="space-y-2">{lines.map((line, index) => { const ingredient = ingredients.find((item) => item.id === line.inventoryItemId); return <div key={line.inventoryItemId} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_90px_auto]"><select value={line.inventoryItemId} onChange={(event) => updateLine(index, { inventoryItemId: event.target.value, unit: ingredients.find((item) => item.id === event.target.value)?.unit ?? "unit" })} className="inventory-input"><option value="">Choose ingredient</option>{ingredients.filter((item) => item.id === line.inventoryItemId || !lines.some((entry, position) => position !== index && entry.inventoryItemId === item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Input type="number" min="0.0001" step="any" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} aria-label="Ingredient quantity" /><span className="flex items-center rounded-lg bg-paper-dim px-3 text-xs text-ink/60 dark:bg-ink dark:text-paper/65">{ingredient?.unit ?? line.unit}</span><button type="button" onClick={() => setLines((current) => current.filter((_, position) => position !== index))} className="rounded-lg px-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-300" aria-label="Remove ingredient">×</button></div>; })}</div>{!ingredients.length ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-100">Add stock ingredients before building recipes.</p> : <button type="button" onClick={addIngredient} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300">+ Add ingredient</button>}{status ? <p className={`rounded-lg px-3 py-2 text-xs ${error ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-100" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100"}`}>{status}</p> : null}<Button type="submit" disabled={isPending || !products.length || !lines.length} className="w-full">{isPending ? "Saving recipe…" : `Save recipe${selectedProduct ? ` for ${selectedProduct.name}` : ""}`}</Button></form></Card>;
}