"use client";

import { useMemo, useRef, useState } from "react";
import { createOrderAction } from "@/actions/order.actions";

interface MenuProduct {
  id: string;
  name: string;
  kitchenStation?: string;
  variants: { id: string; name: string; priceMinor: number; isDefault?: boolean }[];
  modifierGroups: {
    id: string;
    name: string;
    minSelect: number;
    maxSelect: number;
    options: { id: string; name: string; priceMinor: number }[];
  }[];
}

interface CartLine {
  key: string; // client-only line id, so the same product can appear twice with different modifiers
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  unitPriceMinor: number;
  quantity: number;
  modifierOptionIds: string[];
  modifiersLabel: string;
}

function formatMoney(minorUnits: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(minorUnits / 100);
}

export function PosClient({ menu, branchId }: { menu: MenuProduct[]; branchId: string | null }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [status, setStatus] = useState<{ kind: "idle" | "submitting" | "error" | "success"; message?: string }>({
    kind: "idle",
  });
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPriceMinor * line.quantity, 0),
    [cart]
  );

  function addToCart(product: MenuProduct) {
    const variant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id && l.variantId === variant?.id && l.modifierOptionIds.length === 0);
      if (existing) {
        return prev.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          variantId: variant?.id,
          variantName: variant?.name,
          unitPriceMinor: variant?.priceMinor ?? 0,
          quantity: 1,
          modifierOptionIds: [],
          modifiersLabel: "",
        },
      ];
    });
  }

  function updateQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  async function submitOrder() {
    if (!branchId) {
      setStatus({ kind: "error", message: "No active branch selected for this session." });
      return;
    }
    if (cart.length === 0) return;

    setStatus({ kind: "submitting" });
    const result = await createOrderAction({
      branchId,
      orderType: "DINE_IN",
      items: cart.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
        modifierOptionIds: l.modifierOptionIds,
      })),
      idempotencyKey: idempotencyKeyRef.current,
    });

    if (result.ok) {
      setStatus({ kind: "success", message: `Order #${result.data.orderNumber} sent to the kitchen.` });
      setCart([]);
      idempotencyKeyRef.current = crypto.randomUUID(); // fresh key for the next, distinct order
    } else {
      // Same idempotencyKey is kept on failure — retrying resubmits safely
      // instead of risking a duplicate order.
      setStatus({ kind: "error", message: result.error.message });
    }
  }

  return (
    <div className="grid h-screen grid-cols-[1fr_360px] bg-paper text-ink dark:bg-ink dark:text-paper">
      <div className="overflow-y-auto p-6">
        <h1 className="font-display text-xl mb-4">Menu</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {menu.map((product) => {
            const variant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="rounded-lg border border-ink-line/20 bg-white p-3 text-left transition-colors hover:border-ember dark:bg-ink-soft"
              >
                <p className="font-medium">{product.name}</p>
                <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">{formatMoney(variant?.priceMinor ?? 0)}</p>
              </button>
            );
          })}
          {menu.length === 0 && <p className="col-span-full text-sm text-ink/50 dark:text-paper/50">No menu items yet.</p>}
        </div>
      </div>

      <aside className="flex flex-col border-l border-ink-line/20 bg-white dark:bg-ink-soft">
        <div className="p-4 border-b border-ink-line/20 font-display">Current order</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((line) => (
            <div key={line.key} className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{line.productName}</p>
                {line.variantName && <p className="text-xs text-ink/50 dark:text-paper/50">{line.variantName}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(line.key, -1)}
                  className="w-6 h-6 rounded border border-ink-line/30 text-sm"
                  aria-label={`Remove one ${line.productName}`}
                >
                  −
                </button>
                <span className="w-4 text-center text-sm tabular-nums">{line.quantity}</span>
                <button
                  onClick={() => updateQuantity(line.key, 1)}
                  className="w-6 h-6 rounded border border-ink-line/30 text-sm"
                  aria-label={`Add one more ${line.productName}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && <p className="text-sm text-ink/40 dark:text-paper/40">Tap a menu item to add it.</p>}
        </div>
        <div className="p-4 border-t border-ink-line/20 space-y-3">
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(total)}</span>
          </div>
          {status.kind === "error" && <p className="text-sm text-status-cancelled">{status.message}</p>}
          {status.kind === "success" && <p className="text-sm text-status-ready">{status.message}</p>}
          <button
            onClick={submitOrder}
            disabled={cart.length === 0 || status.kind === "submitting"}
            className="w-full rounded bg-ember hover:bg-ember-dark disabled:opacity-40 transition-colors text-white py-2 font-medium"
          >
            {status.kind === "submitting" ? "Sending…" : "Send to kitchen"}
          </button>
        </div>
      </aside>
    </div>
  );
}
