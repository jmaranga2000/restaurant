"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createOrderAction,
  mergeHeldOrdersAction,
  recordPaymentAction,
  refundPaymentAction,
  sendHeldOrderAction,
  splitHeldOrderAction,
  transferOrderTableAction,
  voidOrderAction,
} from "@/actions/order.actions";

type PaymentCode = "CASH" | "MPESA" | "CARD" | "BANK" | "OTHER";
type OrderType = "DINE_IN" | "TAKEAWAY" | "PICKUP" | "DELIVERY";

interface MenuProduct {
  id: string;
  name: string;
  description?: string;
  category: string;
  kitchenStation?: string;
  variants: { id: string; name: string; priceMinor: number; isDefault?: boolean }[];
  modifierGroups: { id: string; name: string; minSelect: number; maxSelect: number; options: { id: string; name: string; priceMinor: number }[] }[];
}

interface CartLine {
  key: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  basePriceMinor: number;
  unitPriceMinor: number;
  quantity: number;
  modifierOptionIds: string[];
  notes: string;
}

interface OpenTicket {
  id: string;
  number: string;
  status: string;
  orderType: string;
  tableId?: string;
  customerId?: string;
  totalMinor: number;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  serviceChargeMinor: number;
  createdAt: string;
  payments: { method: string; amountMinor: number; reference?: string; note?: string }[];
  items: { id: string; name: string; quantity: number; unitPriceMinor: number }[];
}

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(minor / 100);
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function minorFromInput(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function PosClient({
  menu,
  branchId,
  currency,
  restaurantName,
  receipt,
  taxRatePercent,
  serviceChargePercent,
  pricesIncludeTax,
  tables,
  customers,
  paymentMethods,
  canDiscount,
  canRefund,
  canVoid,
  openTickets,
}: {
  menu: MenuProduct[];
  branchId: string | null;
  currency: string;
  restaurantName: string;
  receipt: { header?: string; footer?: string; prefix?: string };
  taxRatePercent: number;
  serviceChargePercent: number;
  pricesIncludeTax: boolean;
  tables: { id: string; label: string; seats: number; status: string }[];
  customers: { id: string; name: string; phone?: string; email?: string }[];
  paymentMethods: { code: PaymentCode; label: string }[];
  canDiscount: boolean;
  canRefund: boolean;
  canVoid: boolean;
  openTickets: OpenTicket[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [tableId, setTableId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [applyTax, setApplyTax] = useState(!pricesIncludeTax);
  const [applyServiceCharge, setApplyServiceCharge] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedLineKey, setSelectedLineKey] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<OpenTicket | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentCode>(paymentMethods[0]?.code ?? "CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  const categories = useMemo(() => ["All", ...Array.from(new Set(menu.map((item) => item.category)))], [menu]);
  const visibleMenu = useMemo(() => menu.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const phrase = query.trim().toLowerCase();
    return matchesCategory && (!phrase || `${item.name} ${item.description ?? ""}`.toLowerCase().includes(phrase));
  }), [category, menu, query]);
  const selectedLine = cart.find((line) => line.key === selectedLineKey) ?? null;
  const selectedProduct = selectedLine ? menu.find((product) => product.id === selectedLine.productId) : undefined;
  const subtotalMinor = useMemo(() => cart.reduce((sum, line) => sum + line.unitPriceMinor * line.quantity, 0), [cart]);
  const parsedDiscount = canDiscount ? Math.min(100, Math.max(0, Number(discountPercent) || 0)) : 0;
  const discountMinor = Math.round(subtotalMinor * parsedDiscount / 100);
  const chargeableMinor = Math.max(0, subtotalMinor - discountMinor);
  const taxMinor = applyTax ? Math.round(chargeableMinor * taxRatePercent / 100) : 0;
  const serviceMinor = applyServiceCharge ? Math.round(chargeableMinor * serviceChargePercent / 100) : 0;
  const orderTotalMinor = chargeableMinor + taxMinor + serviceMinor;
  const heldTickets = openTickets.filter((ticket) => ticket.status === "DRAFT");
  const activePaidMinor = activeTicket?.payments.reduce((sum, payment) => sum + payment.amountMinor, 0) ?? 0;
  const activeBalanceMinor = activeTicket ? Math.max(0, activeTicket.totalMinor - activePaidMinor) : 0;

  function showError(message: string) { setNotice({ type: "error", message }); }
  function showSuccess(message: string) { setNotice({ type: "success", message }); }

  function addToCart(product: MenuProduct) {
    const variant = product.variants.find((entry) => entry.isDefault) ?? product.variants[0];
    if (!variant) return showError("This menu item needs a price before it can be sold.");
    const nextLine: CartLine = {
      key: crypto.randomUUID(), productId: product.id, productName: product.name,
      variantId: variant.id, variantName: variant.name, basePriceMinor: variant.priceMinor,
      unitPriceMinor: variant.priceMinor, quantity: 1, modifierOptionIds: [], notes: "",
    };
    setCart((current) => [...current, nextLine]);
    setSelectedLineKey(nextLine.key);
  }

  function updateLine(key: string, update: Partial<CartLine>) {
    setCart((current) => current.map((line) => line.key === key ? { ...line, ...update } : line));
  }

  function updateQuantity(key: string, delta: number) {
    setCart((current) => current.flatMap((line) => {
      if (line.key !== key) return [line];
      const quantity = line.quantity + delta;
      return quantity > 0 ? [{ ...line, quantity }] : [];
    }));
    if (selectedLineKey === key && cart.find((line) => line.key === key)?.quantity === 1 && delta < 0) setSelectedLineKey(null);
  }

  function changeVariant(variantId: string) {
    if (!selectedLine || !selectedProduct) return;
    const variant = selectedProduct.variants.find((entry) => entry.id === variantId);
    if (!variant) return;
    const modifierTotal = selectedProduct.modifierGroups.flatMap((group) => group.options)
      .filter((option) => selectedLine.modifierOptionIds.includes(option.id))
      .reduce((sum, option) => sum + option.priceMinor, 0);
    updateLine(selectedLine.key, { variantId: variant.id, variantName: variant.name, basePriceMinor: variant.priceMinor, unitPriceMinor: variant.priceMinor + modifierTotal });
  }

  function toggleModifier(optionId: string, group: MenuProduct["modifierGroups"][number]) {
    if (!selectedLine || !selectedProduct) return;
    const inGroup = new Set(group.options.map((option) => option.id));
    const wasSelected = selectedLine.modifierOptionIds.includes(optionId);
    const selectedInGroup = selectedLine.modifierOptionIds.filter((id) => inGroup.has(id));
    if (!wasSelected && selectedInGroup.length >= group.maxSelect) return showError(`Choose up to ${group.maxSelect} option${group.maxSelect === 1 ? "" : "s"} for ${group.name}.`);
    const modifierOptionIds = wasSelected
      ? selectedLine.modifierOptionIds.filter((id) => id !== optionId)
      : [...selectedLine.modifierOptionIds, optionId];
    const modifierTotal = selectedProduct.modifierGroups.flatMap((entry) => entry.options)
      .filter((option) => modifierOptionIds.includes(option.id))
      .reduce((sum, option) => sum + option.priceMinor, 0);
    updateLine(selectedLine.key, { modifierOptionIds, unitPriceMinor: selectedLine.basePriceMinor + modifierTotal });
  }

  function validateOrder() {
    if (!branchId) return "Choose an active branch before taking an order.";
    if (!cart.length) return "Add at least one menu item.";
    if (orderType === "DINE_IN" && !tableId) return "Choose a table for a dine-in order.";
    for (const line of cart) {
      const product = menu.find((entry) => entry.id === line.productId);
      for (const group of product?.modifierGroups ?? []) {
        const count = line.modifierOptionIds.filter((id) => group.options.some((option) => option.id === id)).length;
        if (count < group.minSelect) return `${line.productName}: choose at least ${group.minSelect} option${group.minSelect === 1 ? "" : "s"} for ${group.name}.`;
      }
    }
    return null;
  }

  async function submitOrder(submitMode: "HOLD" | "SEND_TO_KITCHEN") {
    const invalid = validateOrder();
    if (invalid) return showError(invalid);
    setBusy(submitMode);
    setNotice(null);
    const result = await createOrderAction({
      branchId: branchId!, orderType, tableId: tableId || undefined, customerId: customerId || undefined,
      notes: orderNotes || undefined, discountPercent: parsedDiscount, applyTax, applyServiceCharge, submitMode,
      items: cart.map((line) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantity, modifierOptionIds: line.modifierOptionIds, notes: line.notes || undefined })),
      idempotencyKey: idempotencyKey.current,
    });
    setBusy(null);
    if (!result.ok) return showError(result.error.message);
    const ticket: OpenTicket = { id: result.data.orderId, number: result.data.orderNumber, status: result.data.status, orderType, tableId: tableId || undefined, customerId: customerId || undefined, subtotalMinor, discountMinor, taxMinor, serviceChargeMinor: serviceMinor, totalMinor: result.data.totalMinor, createdAt: new Date().toISOString(), payments: [], items: cart.map((line) => ({ id: line.key, name: line.productName, quantity: line.quantity, unitPriceMinor: line.unitPriceMinor })) };
    setActiveTicket(ticket);
    setCart([]); setSelectedLineKey(null); setOrderNotes(""); setDiscountPercent("0"); idempotencyKey.current = crypto.randomUUID();
    showSuccess(submitMode === "HOLD" ? `Order #${result.data.orderNumber} is safely held.` : `Order #${result.data.orderNumber} was sent to the kitchen.`);
    router.refresh();
  }

  function selectTicket(ticket: OpenTicket) {
    setActiveTicket(ticket); setPaymentAmount(""); setPaymentReference(""); setPaymentMethod(paymentMethods[0]?.code ?? "CASH"); setNotice(null);
  }

  async function recordPayment() {
    if (!activeTicket) return showError("Select an open order first.");
    const amountMinor = minorFromInput(paymentAmount);
    if (!amountMinor) return showError("Enter a valid payment amount.");
    setBusy("payment");
    const result = await recordPaymentAction({ orderId: activeTicket.id, method: paymentMethod, amountMinor, reference: paymentReference || undefined });
    setBusy(null);
    if (!result.ok) return showError(result.error.message);
    setActiveTicket((ticket) => ticket ? { ...ticket, payments: [...ticket.payments, { method: paymentMethod, amountMinor, reference: paymentReference || undefined }] } : ticket);
    setPaymentAmount(""); setPaymentReference("");
    showSuccess(result.data.balanceMinor > 0 ? `Payment saved. ${money(result.data.balanceMinor, currency)} remains.` : "Order paid in full. You can print the receipt.");
    router.refresh();
  }

  async function refundPayment() {
    if (!activeTicket) return showError("Select a paid order first.");
    const amountMinor = minorFromInput(paymentAmount);
    if (!amountMinor) return showError("Enter the refund amount.");
    const reason = window.prompt("Why is this payment being refunded?");
    if (!reason) return;
    setBusy("refund");
    const result = await refundPaymentAction({ orderId: activeTicket.id, method: paymentMethod, amountMinor, reference: paymentReference || undefined, reason });
    setBusy(null);
    if (!result.ok) return showError(result.error.message);
    setActiveTicket((ticket) => ticket ? { ...ticket, payments: [...ticket.payments, { method: paymentMethod, amountMinor: -amountMinor, reference: paymentReference || undefined, note: `Refund: ${reason}` }] } : ticket);
    setPaymentAmount(""); setPaymentReference(""); showSuccess("Refund recorded with a full audit trail."); router.refresh();
  }

  async function sendHeld(ticket: OpenTicket) {
    setBusy(`send-${ticket.id}`);
    const result = await sendHeldOrderAction({ orderId: ticket.id });
    setBusy(null);
    if (!result.ok) return showError(result.error.message);
    setActiveTicket({ ...ticket, status: result.data.status }); showSuccess(`Order #${ticket.number} sent to kitchen.`); router.refresh();
  }

  async function transferTable(tableIdValue: string) {
    if (!activeTicket || !tableIdValue) return;
    setBusy("transfer");
    const result = await transferOrderTableAction({ orderId: activeTicket.id, tableId: tableIdValue });
    setBusy(null);
    if (!result.ok) return showError(result.error.message);
    setActiveTicket({ ...activeTicket, tableId: result.data.tableId }); showSuccess("Table transfer saved."); router.refresh();
  }

  async function voidTicket() {
    if (!activeTicket) return;
    const reason = window.prompt(`Void/cancel order #${activeTicket.number}. Add a reason:`);
    if (!reason) return;
    setBusy("void"); const result = await voidOrderAction({ orderId: activeTicket.id, reason }); setBusy(null);
    if (!result.ok) return showError(result.error.message);
    setActiveTicket(null); showSuccess(`Order #${activeTicket.number} was ${result.data.status.toLowerCase()}.`); router.refresh();
  }

  async function splitHeld(ticket: OpenTicket) {
    const chosen = window.prompt(`Split order #${ticket.number}. Enter item numbers separated by commas, for example: 1,3`);
    if (!chosen) return;
    const indexes = chosen.split(",").map((value) => Number(value.trim()) - 1).filter((index) => Number.isInteger(index) && ticket.items[index]);
    const itemIds = Array.from(new Set(indexes.map((index) => ticket.items[index]!.id)));
    if (!itemIds.length) return showError("Enter one or more valid item numbers from this held order.");
    setBusy(`split-${ticket.id}`); const result = await splitHeldOrderAction({ orderId: ticket.id, itemIds }); setBusy(null);
    if (!result.ok) return showError(result.error.message);
    showSuccess(`Created held order #${result.data.orderNumber}.`); router.refresh();
  }

  async function mergeHeld() {
    if (!activeTicket || !mergeTargetId) return showError("Choose a second held order to merge.");
    setBusy("merge"); const result = await mergeHeldOrdersAction({ primaryOrderId: activeTicket.id, secondaryOrderId: mergeTargetId }); setBusy(null);
    if (!result.ok) return showError(result.error.message);
    setMergeTargetId(""); showSuccess(`Held order merged into #${result.data.orderNumber}.`); router.refresh();
  }

  return (
    <main className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper print:bg-white print:text-black">
      <div className="print:hidden">
      <div className="border-b border-ink-line/15 bg-white px-4 py-4 dark:border-ink-line dark:bg-ink-soft print:hidden sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Live point of sale</p><h1 className="font-display text-2xl">Service counter</h1></div>
          <div className="flex items-center gap-2"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">● Online</span><button onClick={() => router.refresh()} className="rounded-lg border border-ink-line/20 px-3 py-2 text-xs hover:bg-paper-dim dark:border-ink-line dark:hover:bg-ink-line">Refresh orders</button></div>
        </div>
      </div>

      {notice ? <div className={`mx-auto mt-4 max-w-[1600px] rounded-lg border px-4 py-3 text-sm print:hidden ${notice.type === "error" ? "border-red-300 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100" : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100"}`}>{notice.message}</div> : null}

      {!branchId ? <div className="mx-auto max-w-2xl p-8"><div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"><h2 className="font-display text-xl">Choose a branch first</h2><p className="mt-2 text-sm">The POS needs an active branch so orders, tables, kitchen tickets, and payments stay correctly scoped.</p></div></div> :
      <div className="mx-auto grid max-w-[1600px] gap-4 p-4 xl:grid-cols-[245px_minmax(0,1fr)_400px] sm:p-6">
        <aside className="order-2 rounded-xl border border-ink-line/15 bg-white p-3 dark:border-ink-line dark:bg-ink-soft xl:order-1 xl:sticky xl:top-4 xl:h-[calc(100vh-8rem)] xl:overflow-y-auto print:hidden">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45 dark:text-paper/45">Orders & payments</p>
          <div className="space-y-2">
            {openTickets.length ? openTickets.map((ticket) => <div key={ticket.id} className={`rounded-lg border p-3 ${activeTicket?.id === ticket.id ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-400/10" : "border-ink-line/15 dark:border-ink-line"}`}>
              <button className="w-full text-left" onClick={() => selectTicket(ticket)}><div className="flex items-center justify-between"><span className="font-medium">#{ticket.number}</span><span className="text-[10px] font-semibold uppercase tracking-wide text-ink/50 dark:text-paper/55">{titleCase(ticket.status)}</span></div><p className="mt-1 text-xs text-ink/55 dark:text-paper/60">{ticket.tableId ? tables.find((table) => table.id === ticket.tableId)?.label ?? "Table" : titleCase(ticket.orderType)}</p><p className="mt-2 text-sm font-medium">{money(ticket.totalMinor, currency)}</p></button>
              {ticket.status === "DRAFT" ? <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => sendHeld(ticket)} disabled={busy === `send-${ticket.id}`} className="rounded bg-indigo-600 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50">{busy === `send-${ticket.id}` ? "Sending…" : "Send"}</button><button onClick={() => splitHeld(ticket)} disabled={busy === `split-${ticket.id}`} className="rounded border border-ink-line/20 px-2 py-1.5 text-xs dark:border-ink-line">Split</button></div> : null}
            </div>) : <p className="px-2 py-5 text-sm text-ink/45 dark:text-paper/45">No open tickets yet.</p>}
          </div>
        </aside>

        <section className="order-1 min-w-0 xl:order-2">
          <div className="rounded-xl border border-ink-line/15 bg-white p-4 dark:border-ink-line dark:bg-ink-soft print:hidden">
            <div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-medium">Search menu<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search food or drink" className="mt-1.5 w-full rounded-lg border border-ink-line/20 bg-paper px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-ink-line dark:bg-ink" /></label><div><p className="text-xs font-medium">Service type</p><div className="mt-1.5 flex flex-wrap gap-1.5">{(["DINE_IN", "TAKEAWAY", "PICKUP", "DELIVERY"] as OrderType[]).map((type) => <button key={type} onClick={() => { setOrderType(type); if (type !== "DINE_IN") setTableId(""); }} className={`rounded-lg px-3 py-2 text-xs font-medium ${orderType === type ? "bg-indigo-600 text-white" : "bg-paper-dim text-ink/65 hover:bg-indigo-50 dark:bg-ink dark:text-paper/65 dark:hover:bg-indigo-400/10"}`}>{titleCase(type)}</button>)}</div></div></div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{categories.map((entry) => <button key={entry} onClick={() => setCategory(entry)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${category === entry ? "bg-ink text-paper dark:bg-paper dark:text-ink" : "border border-ink-line/20 text-ink/60 dark:border-ink-line dark:text-paper/65"}`}>{entry}</button>)}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">{visibleMenu.map((product) => { const variant = product.variants.find((entry) => entry.isDefault) ?? product.variants[0]; return <button key={product.id} onClick={() => addToCart(product)} className="min-h-32 rounded-xl border border-ink-line/15 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-ink-line dark:bg-ink-soft"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-300">{product.category}</p><p className="mt-3 font-medium">{product.name}</p>{product.description ? <p className="mt-1 line-clamp-2 text-xs text-ink/50 dark:text-paper/55">{product.description}</p> : null}<p className="mt-3 text-sm font-semibold">{money(variant?.priceMinor ?? 0, currency)}</p></button>; })}</div>
          {!visibleMenu.length ? <div className="mt-4 rounded-xl border border-dashed border-ink-line/25 p-10 text-center text-sm text-ink/50 dark:border-ink-line dark:text-paper/55">No menu items match this search.</div> : null}
        </section>

        <aside className="order-3 rounded-xl border border-ink-line/15 bg-white dark:border-ink-line dark:bg-ink-soft xl:sticky xl:top-4 xl:h-[calc(100vh-8rem)] xl:overflow-y-auto print:border-0 print:shadow-none">
          <div className="border-b border-ink-line/15 p-4 dark:border-ink-line"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">New sale</p><h2 className="font-display text-xl">Current order</h2></div><button onClick={() => { setCart([]); setSelectedLineKey(null); }} className="text-xs text-ink/50 hover:text-red-600 dark:text-paper/55">Clear</button></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><label className="text-xs font-medium">{orderType === "DINE_IN" ? "Table" : "Table (optional)"}<select value={tableId} onChange={(event) => setTableId(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-line/20 bg-paper px-3 py-2 text-sm dark:border-ink-line dark:bg-ink"><option value="">{orderType === "DINE_IN" ? "Choose table" : "No table"}</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.label} · {titleCase(table.status)}</option>)}</select></label><label className="text-xs font-medium">Customer<select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-line/20 bg-paper px-3 py-2 text-sm dark:border-ink-line dark:bg-ink"><option value="">Walk-in customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` · ${customer.phone}` : ""}</option>)}</select></label></div>
          </div>
          <div className="space-y-3 p-4">{cart.map((line) => <button key={line.key} onClick={() => setSelectedLineKey(line.key)} className={`flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left ${selectedLineKey === line.key ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-400/10" : "border-ink-line/15 dark:border-ink-line"}`}><div><p className="text-sm font-medium">{line.productName}</p><p className="mt-0.5 text-xs text-ink/50 dark:text-paper/55">{line.variantName}{line.modifierOptionIds.length ? ` · ${line.modifierOptionIds.length} modifier${line.modifierOptionIds.length === 1 ? "" : "s"}` : ""}</p><p className="mt-1 text-xs font-medium">{money(line.unitPriceMinor * line.quantity, currency)}</p></div><span onClick={(event) => event.stopPropagation()} className="flex items-center gap-2"><button onClick={() => updateQuantity(line.key, -1)} className="grid h-6 w-6 place-items-center rounded border border-ink-line/25 text-sm dark:border-ink-line">−</button><span className="w-3 text-center text-sm">{line.quantity}</span><button onClick={() => updateQuantity(line.key, 1)} className="grid h-6 w-6 place-items-center rounded border border-ink-line/25 text-sm dark:border-ink-line">+</button></span></button>)}{!cart.length ? <p className="py-10 text-center text-sm text-ink/45 dark:text-paper/50">Add items from the menu to start an order.</p> : null}</div>
          {selectedLine && selectedProduct ? <div className="border-y border-ink-line/15 bg-paper-dim p-4 dark:border-ink-line dark:bg-ink print:hidden"><div className="flex items-center justify-between"><p className="text-sm font-medium">Edit {selectedLine.productName}</p><button onClick={() => setSelectedLineKey(null)} className="text-xs text-ink/50 dark:text-paper/55">Done</button></div>{selectedProduct.variants.length > 1 ? <label className="mt-3 block text-xs font-medium">Size / variant<select value={selectedLine.variantId} onChange={(event) => changeVariant(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2 text-sm dark:border-ink-line dark:bg-ink-soft">{selectedProduct.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} · {money(variant.priceMinor, currency)}</option>)}</select></label> : null}{selectedProduct.modifierGroups.map((group) => <div key={group.id} className="mt-3"><p className="text-xs font-medium">{group.name} <span className="font-normal text-ink/50 dark:text-paper/50">up to {group.maxSelect}</span></p><div className="mt-1.5 flex flex-wrap gap-1.5">{group.options.map((option) => <button key={option.id} onClick={() => toggleModifier(option.id, group)} className={`rounded-full border px-2.5 py-1 text-xs ${selectedLine.modifierOptionIds.includes(option.id) ? "border-indigo-600 bg-indigo-600 text-white" : "border-ink-line/25 bg-white text-ink/70 dark:border-ink-line dark:bg-ink-soft dark:text-paper/70"}`}>{option.name}{option.priceMinor ? ` +${money(option.priceMinor, currency)}` : ""}</button>)}</div></div>)}<label className="mt-3 block text-xs font-medium">Item note<textarea value={selectedLine.notes} onChange={(event) => updateLine(selectedLine.key, { notes: event.target.value })} placeholder="e.g. no onions, allergy note" maxLength={280} className="mt-1 w-full resize-none rounded-lg border border-ink-line/20 bg-white px-3 py-2 text-sm dark:border-ink-line dark:bg-ink-soft" rows={2} /></label></div> : null}
          <div className="space-y-2 border-t border-ink-line/15 p-4 dark:border-ink-line"><label className="block text-xs font-medium">Order note<textarea value={orderNotes} onChange={(event) => setOrderNotes(event.target.value)} placeholder="Kitchen or service note" maxLength={500} className="mt-1 w-full resize-none rounded-lg border border-ink-line/20 bg-paper px-3 py-2 text-sm dark:border-ink-line dark:bg-ink" rows={2} /></label>{canDiscount ? <label className="block text-xs font-medium">Discount (%)<input type="number" min="0" max="100" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-line/20 bg-paper px-3 py-2 text-sm dark:border-ink-line dark:bg-ink" /></label> : null}<div className="flex flex-wrap gap-3 py-1 text-xs"><label className="flex items-center gap-1.5"><input type="checkbox" checked={applyTax} onChange={(event) => setApplyTax(event.target.checked)} />Tax {taxRatePercent}%</label><label className="flex items-center gap-1.5"><input type="checkbox" checked={applyServiceCharge} onChange={(event) => setApplyServiceCharge(event.target.checked)} />Service {serviceChargePercent}%</label></div><div className="space-y-1 border-t border-ink-line/15 pt-3 text-sm dark:border-ink-line"><p className="flex justify-between text-ink/60 dark:text-paper/60"><span>Subtotal</span><span>{money(subtotalMinor, currency)}</span></p>{discountMinor ? <p className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>Discount</span><span>−{money(discountMinor, currency)}</span></p> : null}{taxMinor ? <p className="flex justify-between text-ink/60 dark:text-paper/60"><span>Tax</span><span>{money(taxMinor, currency)}</span></p> : null}{serviceMinor ? <p className="flex justify-between text-ink/60 dark:text-paper/60"><span>Service charge</span><span>{money(serviceMinor, currency)}</span></p> : null}<p className="flex justify-between pt-2 font-display text-xl"><span>Total</span><span>{money(orderTotalMinor, currency)}</span></p></div><div className="grid grid-cols-2 gap-2 print:hidden"><button onClick={() => submitOrder("HOLD")} disabled={busy !== null || !cart.length} className="rounded-lg border border-ink-line/25 px-3 py-2.5 text-sm font-medium hover:bg-paper-dim disabled:opacity-50 dark:border-ink-line dark:hover:bg-ink-line">{busy === "HOLD" ? "Holding…" : "Hold order"}</button><button onClick={() => submitOrder("SEND_TO_KITCHEN")} disabled={busy !== null || !cart.length} className="rounded-lg bg-ember px-3 py-2.5 text-sm font-medium text-white hover:bg-ember-dark disabled:opacity-50">{busy === "SEND_TO_KITCHEN" ? "Sending…" : "Send to kitchen"}</button></div></div>
        </aside>
      </div>}

      {activeTicket ? <section className="mx-auto mb-8 max-w-[1600px] px-4 print:hidden sm:px-6"><div className="rounded-xl border border-ink-line/15 bg-white p-5 dark:border-ink-line dark:bg-ink-soft"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Payment & order tools</p><h2 className="font-display text-xl">Order #{activeTicket.number}</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">{titleCase(activeTicket.status)} · {money(activeTicket.totalMinor, currency)} total · {money(activeBalanceMinor, currency)} outstanding</p></div><button onClick={() => window.print()} className="rounded-lg border border-ink-line/20 px-3 py-2 text-xs font-medium hover:bg-paper-dim dark:border-ink-line dark:hover:bg-ink-line">Print receipt</button></div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="rounded-lg bg-paper-dim p-4 dark:bg-ink"><h3 className="font-medium">Accept payment</h3><div className="mt-3 grid gap-2 sm:grid-cols-3"><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentCode)} className="rounded-lg border border-ink-line/20 bg-white px-3 py-2 text-sm dark:border-ink-line dark:bg-ink-soft">{paymentMethods.map((method) => <option key={method.code} value={method.code}>{method.label}</option>)}</select><input value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} type="number" min="0" step="0.01" placeholder="Amount" className="rounded-lg border border-ink-line/20 bg-white px-3 py-2 text-sm dark:border-ink-line dark:bg-ink-soft" /><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Reference (optional)" className="rounded-lg border border-ink-line/20 bg-white px-3 py-2 text-sm dark:border-ink-line dark:bg-ink-soft" /></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setPaymentAmount(String(activeBalanceMinor / 100))} className="rounded border border-ink-line/20 px-3 py-1.5 text-xs dark:border-ink-line">Use balance</button><button onClick={recordPayment} disabled={busy === "payment" || activeBalanceMinor === 0} className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">{busy === "payment" ? "Saving…" : "Record payment"}</button>{canRefund ? <button onClick={refundPayment} disabled={busy === "refund" || activePaidMinor <= 0} className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50 dark:border-red-400/40 dark:text-red-200">{busy === "refund" ? "Refunding…" : "Refund"}</button> : null}</div><p className="mt-3 text-xs text-ink/50 dark:text-paper/55">Record multiple tenders for partial or split payment. Each payment and refund stays on this order for reconciliation.</p></div>
          <div><h3 className="font-medium">Payments recorded</h3>{activeTicket.payments.length ? <div className="mt-3 space-y-2">{activeTicket.payments.map((payment, index) => <div key={`${payment.method}-${index}`} className="flex items-center justify-between rounded-lg border border-ink-line/15 px-3 py-2 text-sm dark:border-ink-line"><span>{titleCase(payment.method)}{payment.reference ? ` · ${payment.reference}` : ""}{payment.note ? ` · ${payment.note}` : ""}</span><span className={payment.amountMinor < 0 ? "text-red-600 dark:text-red-300" : "font-medium"}>{payment.amountMinor < 0 ? "−" : ""}{money(Math.abs(payment.amountMinor), currency)}</span></div>)}</div> : <p className="mt-3 rounded-lg border border-dashed border-ink-line/20 p-4 text-sm text-ink/50 dark:border-ink-line dark:text-paper/55">No payment recorded yet.</p>}</div></div>
        <div className="mt-5 grid gap-3 border-t border-ink-line/15 pt-5 dark:border-ink-line lg:grid-cols-3"><label className="text-xs font-medium">Transfer table<select value={activeTicket.tableId ?? ""} onChange={(event) => transferTable(event.target.value)} disabled={busy === "transfer"} className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-paper px-3 py-2 text-sm dark:border-ink-line dark:bg-ink"><option value="">Choose table</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.label}</option>)}</select></label>{activeTicket.status === "DRAFT" ? <div className="text-xs font-medium">Merge held order<select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-paper px-3 py-2 text-sm dark:border-ink-line dark:bg-ink"><option value="">Choose another held order</option>{heldTickets.filter((ticket) => ticket.id !== activeTicket.id).map((ticket) => <option key={ticket.id} value={ticket.id}>#{ticket.number} · {money(ticket.totalMinor, currency)}</option>)}</select><button onClick={mergeHeld} disabled={!mergeTargetId || busy === "merge"} className="mt-2 rounded border border-ink-line/20 px-3 py-1.5 text-xs disabled:opacity-50 dark:border-ink-line">{busy === "merge" ? "Merging…" : "Merge orders"}</button></div> : <div className="text-xs text-ink/50 dark:text-paper/55"><p className="font-medium text-ink dark:text-paper">Order history</p><p className="mt-1">Every status change, table transfer, payment, refund, merge, and void is written to the activity audit.</p></div>}{canVoid ? <div className="flex items-end"><button onClick={voidTicket} disabled={busy === "void"} className="rounded bg-red-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">{busy === "void" ? "Processing…" : "Cancel / void order"}</button></div> : null}</div>
      </div></section> : null}
      </div>
      {activeTicket ? <ThermalReceipt ticket={activeTicket} restaurantName={restaurantName} receipt={receipt} currency={currency} tableLabel={activeTicket.tableId ? tables.find((table) => table.id === activeTicket.tableId)?.label : undefined} paymentLabels={new Map(paymentMethods.map((method) => [method.code, method.label]))} /> : null}
    </main>
  );
}

function ThermalReceipt({
  ticket,
  restaurantName,
  receipt,
  currency,
  tableLabel,
  paymentLabels,
}: {
  ticket: OpenTicket;
  restaurantName: string;
  receipt: { header?: string; footer?: string; prefix?: string };
  currency: string;
  tableLabel?: string;
  paymentLabels: Map<string, string>;
}) {
  const paidMinor = ticket.payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
  const balanceMinor = Math.max(0, ticket.totalMinor - paidMinor);
  const printedAt = new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ticket.createdAt));
  const receiptNumber = receipt.prefix ? `${receipt.prefix}-${ticket.number}` : ticket.number;

  return (
    <section className="hidden print:block print:w-[80mm] print:bg-white print:px-[5mm] print:py-[4mm] print-font">
      <style>{`@media print { @page { size: 80mm auto; margin: 0; } .print-font { font-family: Arial, Helvetica, sans-serif !important; color: #111827 !important; } }`}</style>
      <div className="text-center">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-lg font-bold text-white">R</div>
        <h1 className="mt-2 text-lg font-bold uppercase tracking-tight">{restaurantName}</h1>
        <p className="mt-1 text-[10px] leading-4 text-slate-600">{receipt.header || "Fresh food, thoughtful service."}</p>
        <p className="mt-3 border-y border-dashed border-slate-400 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">Customer receipt</p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 py-3 text-[10px] leading-4">
        <span className="text-slate-500">Receipt</span><span className="text-right font-semibold">#{receiptNumber}</span>
        <span className="text-slate-500">Date</span><span className="text-right">{printedAt}</span>
        <span className="text-slate-500">Service</span><span className="text-right">{tableLabel || titleCase(ticket.orderType)}</span>
        <span className="text-slate-500">Status</span><span className="text-right font-semibold">{titleCase(ticket.status)}</span>
      </div>

      <div className="border-y border-dashed border-slate-400 py-2">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500"><span>Item</span><span>Total</span></div>
        <div className="mt-2 space-y-2 text-[11px]">
          {ticket.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-start justify-between gap-3">
              <span className="min-w-0"><b className="font-medium">{item.quantity} ×</b> {item.name}</span>
              <span className="shrink-0 font-medium">{money(item.quantity * item.unitPriceMinor, currency)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 py-3 text-[11px]">
        <p className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>{money(ticket.subtotalMinor, currency)}</span></p>
        {ticket.discountMinor ? <p className="flex justify-between"><span className="text-slate-600">Discount</span><span>−{money(ticket.discountMinor, currency)}</span></p> : null}
        {ticket.taxMinor ? <p className="flex justify-between"><span className="text-slate-600">Tax</span><span>{money(ticket.taxMinor, currency)}</span></p> : null}
        {ticket.serviceChargeMinor ? <p className="flex justify-between"><span className="text-slate-600">Service charge</span><span>{money(ticket.serviceChargeMinor, currency)}</span></p> : null}
        <p className="flex justify-between border-t border-slate-900 pt-2 text-sm font-bold"><span>Total</span><span>{money(ticket.totalMinor, currency)}</span></p>
      </div>

      <div className="border-y border-dashed border-slate-400 py-3 text-[10px]">
        <p className="font-bold uppercase tracking-[0.1em] text-slate-600">Payment summary</p>
        {ticket.payments.length ? <div className="mt-2 space-y-1.5">{ticket.payments.map((payment, index) => <p key={`${payment.method}-${index}`} className="flex justify-between"><span>{paymentLabels.get(payment.method) ?? titleCase(payment.method)}{payment.reference ? ` · ${payment.reference}` : ""}</span><span className="font-medium">{payment.amountMinor < 0 ? "−" : ""}{money(Math.abs(payment.amountMinor), currency)}</span></p>)}</div> : <p className="mt-2 text-slate-500">No payment recorded</p>}
        <p className="mt-2 flex justify-between font-bold"><span>{balanceMinor ? "Balance due" : "Balance"}</span><span>{money(balanceMinor, currency)}</span></p>
      </div>

      <div className="pt-4 text-center">
        <p className="text-[11px] font-semibold">{receipt.footer || "Thank you for dining with us."}</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-slate-500">Please keep this receipt for your records</p>
        <div className="mx-auto mt-3 h-1.5 w-28 bg-[repeating-linear-gradient(90deg,#111_0,#111_2px,transparent_2px,transparent_4px)]" />
      </div>
    </section>
  );
}
