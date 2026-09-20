"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/actions/order.actions";
import type { OrderStatus } from "@/types/order";

interface BoardOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: { name: string; quantity: number; notes?: string }[];
  createdAt: string;
}

const COLUMNS: { status: OrderStatus | "INCOMING"; title: string; accept: OrderStatus[]; nextStatus?: OrderStatus }[] = [
  { status: "INCOMING", title: "New", accept: ["PLACED", "CONFIRMED"], nextStatus: "PREPARING" },
  { status: "PREPARING", title: "Preparing", accept: ["PREPARING"], nextStatus: "READY" },
  { status: "READY", title: "Ready", accept: ["READY"] },
];

function minutesSince(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function KitchenBoard({ initialOrders }: { initialOrders: BoardOrder[] }) {
  const [orders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Interim polling transport — replace with a subscription to
  // branchChannel(branchId, "kitchen") once a realtime provider is wired
  // into src/lib/realtime.ts (see AblyRealtimeProvider).
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [router]);

  function advance(orderId: string, nextStatus: OrderStatus) {
    startTransition(async () => {
      await updateOrderStatusAction({ orderId, nextStatus });
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4 h-screen bg-ink">
      {COLUMNS.map((col) => {
        const columnOrders = orders.filter((o) => col.accept.includes(o.status));
        return (
          <div key={col.title} className="flex flex-col min-h-0">
            <h2 className="font-display text-paper/80 text-sm uppercase tracking-wide mb-2">
              {col.title} · {columnOrders.length}
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3">
              {columnOrders.map((order) => {
                const delayed = minutesSince(order.createdAt) > 15;
                return (
                  <div
                    key={order.id}
                    className={`rounded-lg p-3 bg-ink-soft border ${
                      delayed ? "border-status-cancelled" : "border-ink-line"
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-mono text-paper text-lg">#{order.orderNumber}</span>
                      <span className={`text-xs ${delayed ? "text-status-cancelled" : "text-paper/50"}`}>
                        {minutesSince(order.createdAt)}m
                      </span>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-paper/90">
                          {item.quantity}× {item.name}
                          {item.notes && <span className="text-paper/50"> — {item.notes}</span>}
                        </li>
                      ))}
                    </ul>
                    {col.nextStatus && (
                      <button
                        disabled={isPending}
                        onClick={() => advance(order.id, col.nextStatus!)}
                        className="w-full rounded bg-ember hover:bg-ember-dark disabled:opacity-40 text-white text-sm py-1.5"
                      >
                        {col.nextStatus === "PREPARING" ? "Start preparing" : "Mark ready"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
