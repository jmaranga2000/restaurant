"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createMenuCategoryAction, saveMenuItemAction, setMenuAvailabilityAction } from "@/actions/menu.actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeading } from "@/components/ui/PageHeading";
import { menuSkuForSequence, suggestedMenuBarcode } from "@/lib/menu-identifiers";

type Variant = { id?: string; name: string; priceMinor: number; isDefault: boolean };
type Modifier = { id?: string; name: string; priceMinor: number };
type ModifierGroup = { id?: string; name: string; minSelect: number; maxSelect: number; options: Modifier[] };
type MenuItem = { id: string; name: string; description: string; categoryId: string; category: string; kitchenStation: string; sku: string; barcode: string; taxRatePercent?: number; isAvailable: boolean; imageUrl?: string; variants: Variant[]; modifierGroups: ModifierGroup[] };
type Draft = Omit<MenuItem, "id" | "category" | "imageUrl"> & { id?: string };

const emptyDraft = (categoryId = ""): Draft => ({ id: undefined, name: "", description: "", categoryId, kitchenStation: "", sku: "", barcode: "", taxRatePercent: undefined, isAvailable: true, variants: [{ name: "Regular", priceMinor: 0, isDefault: true }], modifierGroups: [] });
const money = (minor: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(minor / 100);

export function MenuManager({ categories, items }: { categories: { id: string; name: string }[]; items: MenuItem[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(categories[0]?.id));
  const [autoSku, setAutoSku] = useState(true);
  const [autoBarcode, setAutoBarcode] = useState(true);
  const [modifierTexts, setModifierTexts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [query, setQuery] = useState("");
  const [formKey, setFormKey] = useState(0);
  const itemCount = items.length;
  const unavailable = items.filter((item) => !item.isAvailable).length;
  const modifierCount = items.reduce((sum, item) => sum + item.modifierGroups.length, 0);
  const filteredItems = useMemo(() => items.filter((item) => `${item.name} ${item.category} ${item.sku}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);

  function suggestedIdentifiers(name: string, categoryId: string) {
    const category = categories.find((entry) => entry.id === categoryId)?.name ?? "Menu";
    return { sku: menuSkuForSequence(name, category, 1), barcode: suggestedMenuBarcode(name, category) };
  }
  function reset() {
    setDraft(emptyDraft(categories[0]?.id)); setAutoSku(true); setAutoBarcode(true); setModifierTexts([]); setFormKey((key) => key + 1); setNotice(null);
  }
  function edit(item: MenuItem) {
    setDraft({ ...item, variants: item.variants.map((variant) => ({ ...variant })), modifierGroups: item.modifierGroups.map((group) => ({ ...group, options: group.options.map((option) => ({ ...option })) })) });
    setModifierTexts(item.modifierGroups.map((group) => group.options.map((option) => `${option.name}:${option.priceMinor / 100}`).join(", ")));
    setAutoSku(false); setAutoBarcode(false); setFormKey((key) => key + 1); setNotice(null); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateDraft(field: keyof Draft, value: unknown) {
    setDraft((current) => {
      const next = { ...current, [field]: value };
      if (field !== "name" && field !== "categoryId") return next;
      const identifiers = suggestedIdentifiers(
        field === "name" ? String(value) : current.name,
        field === "categoryId" ? String(value) : current.categoryId,
      );
      return { ...next, ...(autoSku ? { sku: identifiers.sku } : {}), ...(autoBarcode ? { barcode: identifiers.barcode } : {}) };
    });
  }
  function regenerateIdentifiers() {
    const identifiers = suggestedIdentifiers(draft.name, draft.categoryId);
    setAutoSku(true); setAutoBarcode(true);
    setDraft((current) => ({ ...current, ...identifiers }));
  }
  function updateVariant(index: number, update: Partial<Variant>) { setDraft((current) => ({ ...current, variants: current.variants.map((variant, position) => position === index ? { ...variant, ...update } : variant) })); }
  function setDefaultVariant(index: number) { setDraft((current) => ({ ...current, variants: current.variants.map((variant, position) => ({ ...variant, isDefault: position === index })) })); }
  function updateModifierGroup(index: number, update: Partial<ModifierGroup>) { setDraft((current) => ({ ...current, modifierGroups: current.modifierGroups.map((group, position) => position === index ? { ...group, ...update } : group) })); }
  function parseOptions(text: string): Modifier[] { return text.split(",").map((entry) => entry.trim()).filter(Boolean).map((entry) => { const [name, amount] = entry.split(":").map((part) => part.trim()); return { name: name || "Option", priceMinor: Math.round((Number(amount) || 0) * 100) }; }); }

  async function addCategory() {
    const name = window.prompt("New menu category name");
    if (!name) return;
    setBusy(true); const result = await createMenuCategoryAction(name); setBusy(false);
    if (!result.ok) return setNotice({ kind: "error", message: result.error.message });
    setNotice({ kind: "success", message: `Category “${name.trim()}” created.` }); router.refresh();
  }
  async function toggleAvailability(item: MenuItem) {
    setBusy(true); const result = await setMenuAvailabilityAction({ productId: item.id, isAvailable: !item.isAvailable }); setBusy(false);
    if (!result.ok) return setNotice({ kind: "error", message: result.error.message });
    setNotice({ kind: "success", message: `${item.name} is now ${result.data.isAvailable ? "available" : "sold out"} across POS and customer displays.` }); router.refresh();
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categories.length) return setNotice({ kind: "error", message: "Create a category before adding menu items." });
    setBusy(true); setNotice(null);
    const form = new FormData(event.currentTarget);
    const modifierGroups = draft.modifierGroups.map((group, index) => ({ ...group, options: parseOptions(modifierTexts[index] ?? "") }));
    form.set("id", draft.id ?? ""); form.set("variants", JSON.stringify(draft.variants)); form.set("modifierGroups", JSON.stringify(modifierGroups)); form.set("isAvailable", String(draft.isAvailable)); form.set("autoSku", String(autoSku && !draft.id)); form.set("autoBarcode", String(autoBarcode && !draft.id));
    const result = await saveMenuItemAction(form); setBusy(false);
    if (!result.ok) return setNotice({ kind: "error", message: result.error.message });
    setNotice({ kind: "success", message: `${draft.name || "Menu item"} is now saved and available to POS and the customer display.` }); reset(); router.refresh();
  }

  return <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
    <PageHeading eyebrow="Restaurant administration" title="Menu studio" description="Build the single menu your cashiers sell and guests see on the customer display." actions={<Button onClick={reset} variant="secondary" size="sm">+ New menu item</Button>} />
    {notice ? <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${notice.kind === "error" ? "border-red-300 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100" : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100"}`}>{notice.message}</div> : null}
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon="≡" label="Menu items" value={String(itemCount)} detail="Shared with POS & display" /><Metric icon="□" label="Categories" value={String(categories.length)} detail="Organise the guest menu" /><Metric icon="±" label="Modifier groups" value={String(modifierCount)} detail="Options for made-to-order items" /><Metric icon="◷" label="Sold out" value={String(unavailable)} detail="Hidden from sales" /></section>
    <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <Card className="overflow-hidden"><div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">{draft.id ? "Editing menu item" : "Create menu item"}</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">{draft.id ? draft.name : "Make it service-ready"}</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Prices, availability, kitchen routing, images, and modifiers flow directly into POS and the display.</p></div>
        <form key={formKey} onSubmit={save} className="space-y-6 p-5" encType="multipart/form-data">
          <input type="hidden" name="id" value={draft.id ?? ""} />
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Item name" required><Input name="name" value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Classic beef burger" required /></Field><Field label="Category" required><select name="categoryId" value={draft.categoryId} onChange={(event) => updateDraft("categoryId", event.target.value)} required className="menu-select"><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field label="Kitchen station"><Input name="kitchenStation" value={draft.kitchenStation} onChange={(event) => updateDraft("kitchenStation", event.target.value)} placeholder="Grill, bar, pastry…" /></Field><Field label="Menu image"><Input name="image" type="file" accept="image/*" /></Field></div>
          <Field label="Guest-facing description"><textarea name="description" value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} maxLength={500} rows={3} placeholder="Describe the ingredients and flavour." className="menu-select resize-none" /></Field>
          <div className="grid gap-4 sm:grid-cols-3"><Field label="SKU"><Input name="sku" value={draft.sku} onChange={(event) => { setAutoSku(false); updateDraft("sku", event.target.value.toUpperCase()); }} placeholder="Generated automatically" /><p className="mt-1.5 text-[11px] font-normal text-ink/50 dark:text-paper/55">{autoSku ? "A unique SKU is assigned when this item is saved." : "Custom SKU"}</p></Field><Field label="Barcode"><Input name="barcode" inputMode="numeric" value={draft.barcode} onChange={(event) => { setAutoBarcode(false); updateDraft("barcode", event.target.value.replace(/\D/g, "")); }} placeholder="Generated automatically" /><p className="mt-1.5 text-[11px] font-normal text-ink/50 dark:text-paper/55">{autoBarcode ? "EAN-13 barcode generated on save." : "Custom barcode"}</p></Field><Field label="Item tax rate (%)"><Input name="taxRatePercent" type="number" min="0" max="100" step="0.01" value={draft.taxRatePercent ?? ""} onChange={(event) => updateDraft("taxRatePercent", event.target.value ? Number(event.target.value) : undefined)} placeholder="Uses restaurant default" /></Field></div>
          {!draft.id ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-3 text-xs text-indigo-800 dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-100"><span>SKU and barcode are generated automatically and remain editable.</span><button type="button" onClick={regenerateIdentifiers} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-200">Regenerate preview</button></div> : null}
          <label className="flex items-center gap-2 rounded-lg bg-paper-dim px-3 py-3 text-sm font-medium dark:bg-ink"><input type="checkbox" checked={draft.isAvailable} onChange={(event) => updateDraft("isAvailable", event.target.checked)} /> Available to sell now <span className="text-xs font-normal text-ink/50 dark:text-paper/55">(uncheck to mark sold out everywhere)</span></label>
          <EditorSection title="Pricing" description="Use variants for sizes, portions, or other price points."><div className="space-y-2">{draft.variants.map((variant, index) => <div key={index} className="grid grid-cols-[1fr_130px_auto_auto] gap-2"><Input value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} placeholder="Regular" /><Input type="number" min="0" step="0.01" value={variant.priceMinor / 100} onChange={(event) => updateVariant(index, { priceMinor: Math.round((Number(event.target.value) || 0) * 100) })} aria-label="Price" /><button type="button" onClick={() => setDefaultVariant(index)} className={`rounded-lg px-3 text-xs font-medium ${variant.isDefault ? "bg-indigo-600 text-white" : "border border-ink-line/20 text-ink/60 dark:border-ink-line dark:text-paper/65"}`}>Default</button><button type="button" onClick={() => setDraft((current) => ({ ...current, variants: current.variants.length > 1 ? current.variants.filter((_, position) => position !== index) : current.variants }))} className="rounded-lg px-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10" aria-label="Remove price option">×</button></div>)}</div><button type="button" onClick={() => setDraft((current) => ({ ...current, variants: [...current.variants, { name: "New option", priceMinor: 0, isDefault: false }] }))} className="mt-3 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300">+ Add price option</button></EditorSection>
          <EditorSection title="Modifiers" description="Optional choices shown when the cashier adds this item in POS."><div className="space-y-4">{draft.modifierGroups.map((group, index) => <div key={index} className="rounded-lg border border-ink-line/15 p-3 dark:border-ink-line"><div className="grid gap-2 sm:grid-cols-[1fr_90px_90px_auto]"><Input value={group.name} onChange={(event) => updateModifierGroup(index, { name: event.target.value })} placeholder="Add-ons" /><Input type="number" min="0" value={group.minSelect} onChange={(event) => updateModifierGroup(index, { minSelect: Number(event.target.value) || 0 })} aria-label="Minimum selections" /><Input type="number" min="1" value={group.maxSelect} onChange={(event) => updateModifierGroup(index, { maxSelect: Number(event.target.value) || 1 })} aria-label="Maximum selections" /><button type="button" onClick={() => { setDraft((current) => ({ ...current, modifierGroups: current.modifierGroups.filter((_, position) => position !== index) })); setModifierTexts((current) => current.filter((_, position) => position !== index)); }} className="rounded-lg px-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-300">×</button></div><Input value={modifierTexts[index] ?? ""} onChange={(event) => setModifierTexts((current) => current.map((text, position) => position === index ? event.target.value : text))} className="mt-2" placeholder="Options: Extra cheese:100, Bacon:150, No onions:0" /><p className="mt-1 text-[11px] text-ink/50 dark:text-paper/50">Minimum / maximum selections · write each option as name:price, separated by commas.</p></div>)}</div><button type="button" onClick={() => { setDraft((current) => ({ ...current, modifierGroups: [...current.modifierGroups, { name: "Add-ons", minSelect: 0, maxSelect: 1, options: [] }] })); setModifierTexts((current) => [...current, ""]); }} className="mt-3 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300">+ Add modifier group</button></EditorSection>
          <div className="flex flex-wrap justify-end gap-2 border-t border-ink-line/15 pt-5 dark:border-ink-line"><Button type="button" variant="ghost" onClick={reset}>Discard</Button><Button type="submit" disabled={busy}>{busy ? "Saving…" : draft.id ? "Save menu item" : "Create menu item"}</Button></div>
        </form>
      </Card>
      <div className="space-y-5"><Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Categories</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Menu structure</h2><div className="mt-4 flex flex-wrap gap-2">{categories.map((category) => <Badge key={category.id} tone="neutral">{category.name}</Badge>)}{!categories.length ? <p className="text-sm text-ink/50 dark:text-paper/55">No categories yet.</p> : null}</div><Button onClick={addCategory} variant="secondary" size="sm" className="mt-5" disabled={busy}>+ New category</Button></Card><Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Menu toolkit</p><div className="mt-4 grid gap-3">{[{ icon: "▣", title: "Items & images", detail: "Cloudinary-hosted dish images" }, { icon: "±", title: "Modifiers", detail: "Add-ons and required choices" }, { icon: "⊕", title: "Combos", detail: "Build as a named menu item today" }, { icon: "⌘", title: "Recipes", detail: "Connect inventory recipes from the workspace" }, { icon: "◷", title: "Availability", detail: "Mark sold out without deleting history" }].map((feature) => <div key={feature.title} className="flex gap-3 rounded-lg bg-paper-dim p-3 dark:bg-ink"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200">{feature.icon}</span><span><b className="block text-sm text-ink dark:text-paper">{feature.title}</b><small className="text-xs text-ink/55 dark:text-paper/60">{feature.detail}</small></span></div>)}</div></Card></div>
    </section>
    <section className="mt-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Current catalog</p><h2 className="mt-1 font-display text-2xl text-ink dark:text-paper">Menu cards</h2></div><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu items" className="max-w-xs" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{filteredItems.map((item) => <Card key={item.id} className="overflow-hidden"><div className="flex gap-3 p-4"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-dim text-2xl dark:bg-ink">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : "🍽"}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><Badge tone={item.isAvailable ? "success" : "warning"}>{item.isAvailable ? "Available" : "Sold out"}</Badge><h3 className="mt-2 truncate font-medium text-ink dark:text-paper">{item.name}</h3></div><button onClick={() => edit(item)} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300">Edit</button></div><p className="mt-1 text-xs text-ink/55 dark:text-paper/60">{item.category} {item.kitchenStation ? `· ${item.kitchenStation}` : ""}</p><p className="mt-2 text-sm font-semibold text-ink dark:text-paper">{money(item.variants.find((variant) => variant.isDefault)?.priceMinor ?? item.variants[0]?.priceMinor ?? 0)}</p></div></div><div className="flex items-center justify-between border-t border-ink-line/15 px-4 py-3 dark:border-ink-line"><span className="text-xs text-ink/50 dark:text-paper/55">{item.variants.length} price option{item.variants.length === 1 ? "" : "s"} · {item.modifierGroups.length} modifier group{item.modifierGroups.length === 1 ? "" : "s"}</span><button onClick={() => toggleAvailability(item)} disabled={busy} className="text-xs font-medium text-ink/70 hover:text-indigo-600 disabled:opacity-50 dark:text-paper/70 dark:hover:text-indigo-300">{item.isAvailable ? "Mark sold out" : "Make available"}</button></div></Card>)}{!filteredItems.length ? <Card className="col-span-full p-10 text-center text-sm text-ink/50 dark:text-paper/55">No menu items yet. Create your first item above and it will appear in POS and the display automatically.</Card> : null}</div></section>
  </div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">{label}{required ? <span className="text-red-600"> *</span> : null}<span className="mt-1.5 block">{children}</span></label>; }
function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="border-t border-ink-line/15 pt-5 dark:border-ink-line"><h3 className="font-display text-lg text-ink dark:text-paper">{title}</h3><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">{description}</p><div className="mt-4">{children}</div></section>; }
function Metric({ icon, label, value, detail }: { icon: string; label: string; value: string; detail: string }) { return <Card className="p-4"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{icon}</span><b className="font-display text-2xl text-ink dark:text-paper">{value}</b></div><p className="mt-3 text-sm font-medium text-ink dark:text-paper">{label}</p><p className="mt-1 text-xs text-ink/50 dark:text-paper/55">{detail}</p></Card>; }
