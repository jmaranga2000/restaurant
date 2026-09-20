"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { updateKitchenItemsAction } from "@/actions/order.actions";
import type { KitchenItemStatus, OrderStatus } from "@/types/order";

type KitchenItem = {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  kitchenStation: string;
  kitchenStatus: KitchenItemStatus;
  kitchenStartedAt?: string;
  kitchenReadyAt?: string;
};

type BoardOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  tableLabel?: string;
  orderType: string;
  createdAt: string;
  items: KitchenItem[];
};

type KitchenColumn = {
  status: KitchenItemStatus;
  title: string;
  icon: string;
  next: Exclude<KitchenItemStatus, "NEW">;
  action: string;
  color: string;
};

const columns: KitchenColumn[] = [
  { status: "NEW", title: "New orders", icon: "●", next: "PREPARING", action: "Start preparing", color: "border-rose-400/50" },
  { status: "PREPARING", title: "Preparing", icon: "♨", next: "READY", action: "Mark ready", color: "border-amber-400/55" },
  { status: "READY", title: "Ready", icon: "✓", next: "COMPLETED", action: "Complete", color: "border-emerald-400/55" },
];

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function elapsed(iso: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function KitchenBoard({ initialOrders, stations }: { initialOrders: BoardOrder[]; stations: string[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [station, setStation] = useState("All stations");
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const normalizedStation = station.toLowerCase();
  const matchesStation = (item: KitchenItem) => station === "All stations" || item.kitchenStation.toLowerCase() === normalizedStation;
  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      const text = `${order.orderNumber} ${order.tableLabel ?? ""} ${order.items.map((item) => item.name).join(" ")}`.toLowerCase();
      return !query.trim() || text.includes(query.trim().toLowerCase());
    });
  }, [orders, query]);

  function advance(order: BoardOrder, items: KitchenItem[], next: Exclude<KitchenItemStatus, "NEW">) {
    startTransition(async () => {
      const result = await updateKitchenItemsAction({
        orderId: order.id,
        itemIds: items.map((item) => item.id),
        nextStatus: next,
      });

      if (!result.ok) {
        setNotice(result.error.message);
        return;
      }

      setOrders((current) => {
        const updatedAt = new Date().toISOString();
        const nextOrders = current.map((entry) => {
          if (entry.id !== order.id) return entry;

          return {
            ...entry,
            status: result.data.status as OrderStatus,
            items: entry.items.map((item) => {
              if (!items.some((selected) => selected.id === item.id)) return item;

              return {
                ...item,
                kitchenStatus: next,
                ...(next === "PREPARING" ? { kitchenStartedAt: updatedAt } : {}),
                ...(next === "READY" ? { kitchenReadyAt: updatedAt } : {}),
              };
            }),
          };
        });

        return nextOrders.filter((entry) => entry.status !== "SERVED");
      });
      setNotice(`Order #${order.orderNumber} updated.`);
    });
  }

  const activeCount = orders.reduce(
    (sum, order) => sum + order.items.filter((item) => item.kitchenStatus !== "COMPLETED").length,
    0,
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-300">Kitchen display</p>
          <h1 className="mt-1 text-2xl font-semibold">Order workflow</h1>
          <p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Station-aware tickets. Each kitchen item moves independently through preparation.</p>
        </div>
        <label className="w-full max-w-sm rounded-lg border border-ink-line/20 bg-white px-3 py-2 text-sm text-ink/75 shadow-sm dark:border-ink-line dark:bg-white/[.04] dark:text-paper/75 sm:w-72">
          ⌕
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search orders or tables"
            className="ml-2 w-[calc(100%-1.5rem)] bg-transparent outline-none placeholder:text-ink/35 dark:placeholder:text-paper/35"
          />
        </label>
      </div>

      {notice ? (
        <div className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-100">
          {notice}
        </div>
      ) : null}

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStation("All stations")}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm ${station === "All stations" ? "bg-indigo-600 text-white" : "border border-ink-line/20 bg-white text-ink/65 shadow-sm dark:border-white/10 dark:bg-white/[.04] dark:text-paper/65"}`}
        >
          All stations
        </button>
        {stations.map((entry) => (
          <button
            key={entry}
            onClick={() => setStation(entry)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm ${station === entry ? "bg-indigo-600 text-white" : "border border-ink-line/20 bg-white text-ink/65 shadow-sm dark:border-white/10 dark:bg-white/[.04] dark:text-paper/65"}`}
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_260px]">
        {columns.map((column) => {
          const tickets = visibleOrders.flatMap((order) => {
            const items = order.items.filter((item) => matchesStation(item) && item.kitchenStatus === column.status);
            return items.length ? [{ order, items }] : [];
          });

          return (
            <section key={column.status} className={`min-h-[560px] rounded-xl border bg-white p-3 shadow-sm dark:bg-[#081b2d] ${column.color}`}>
              <div className="flex items-center justify-between border-b border-ink-line/15 px-2 pb-3 dark:border-white/10">
                <h2 className="font-semibold">{column.icon} {column.title}</h2>
                <span className="grid h-7 min-w-7 place-items-center rounded-full bg-paper-dim text-xs font-bold dark:bg-white/10">{tickets.length}</span>
              </div>
              <div className="mt-3 space-y-3">
                {tickets.map(({ order, items }) => (
                  <KitchenTicket
                    key={`${order.id}-${column.status}-${items.map((item) => item.id).join("-")}`}
                    order={order}
                    items={items}
                    status={column.status}
                    now={now}
                    pending={isPending}
                    action={column.action}
                    onAdvance={() => advance(order, items, column.next)}
                  />
                ))}
                {!tickets.length ? (
                  <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-ink-line/25 text-center text-sm text-ink/40 dark:border-white/10 dark:text-paper/35">
                    No {column.title.toLowerCase()} in this station
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}

        <aside className="space-y-4">
          <div className="rounded-xl border border-ink-line/15 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#081b2d]">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-ink/45 dark:text-paper/40">Kitchen stations</p>
            <div className="mt-3 space-y-2">
              {stations.map((entry) => {
                const count = orders.reduce(
                  (sum, order) => sum + order.items.filter((item) => item.kitchenStation.toLowerCase() === entry.toLowerCase() && item.kitchenStatus !== "COMPLETED").length,
                  0,
                );

                return (
                  <button
                    key={entry}
                    onClick={() => setStation(entry)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-ink/75 hover:bg-paper-dim dark:text-paper/75 dark:hover:bg-white/5"
                  >
                    <span>{entry}</span>
                    <span className="flex items-center gap-2 text-xs text-ink/50 dark:text-paper/50">
                      {count}
                      <i className="h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-ink-line/15 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#081b2d]">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-ink/45 dark:text-paper/40">Current load</p>
            <p className="mt-3 text-4xl font-semibold text-emerald-600 dark:text-emerald-300">{activeCount}</p>
            <p className="mt-1 text-sm text-ink/55 dark:text-paper/55">Items active in kitchen</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-dim dark:bg-white/10">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, activeCount * 8)}%` }} />
            </div>
          </div>

          <div className="rounded-xl border border-ink-line/15 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#081b2d]">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-ink/45 dark:text-paper/40">Kitchen rules</p>
            <p className="mt-2 text-sm text-ink/65 dark:text-paper/65">Buttons are the primary control. KDS status is mapped to the full order lifecycle and every move is audited.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function KitchenTicket({
  order,
  items,
  status,
  now,
  pending,
  action,
  onAdvance,
}: {
  order: BoardOrder;
  items: KitchenItem[];
  status: KitchenItemStatus;
  now: number;
  pending: boolean;
  action: string;
  onAdvance: () => void;
}) {
  const referenceTime = status === "PREPARING" ? items[0]?.kitchenStartedAt : status === "READY" ? items[0]?.kitchenReadyAt : order.createdAt;

  return (
    <article className="rounded-xl border border-ink-line/15 bg-paper p-4 shadow-[0_10px_24px_rgba(8,44,70,.08)] dark:border-white/10 dark:bg-[#0b2338] dark:shadow-[0_10px_24px_rgba(0,0,0,.18)]">
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-mono text-lg font-bold">#{order.orderNumber}</h3>
          <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">{order.tableLabel ?? titleCase(order.orderType)}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${status === "READY" ? "bg-emerald-400/15 text-emerald-300" : status === "PREPARING" ? "bg-amber-400/15 text-amber-200" : "bg-rose-400/15 text-rose-200"}`}>
          {status === "PREPARING" || status === "READY" ? `⏱ ${elapsed(referenceTime ?? order.createdAt, now)}` : `${elapsed(order.createdAt, now)} ago`}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="text-sm text-ink/85 dark:text-paper/85">
            <span className="mr-2 font-semibold text-ink dark:text-paper">{item.quantity} ×</span>
            {item.name}
            {item.notes ? <p className="mt-1 rounded bg-amber-300/15 px-2 py-1 text-xs text-amber-800 dark:text-amber-100">Note: {item.notes}</p> : null}
          </li>
        ))}
      </ul>

      <button
        onClick={onAdvance}
        disabled={pending}
        className={`mt-5 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${status === "NEW" ? "bg-indigo-600 hover:bg-indigo-500" : status === "PREPARING" ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-600 hover:bg-emerald-500"}`}
      >
        {pending ? "Updating…" : `${action} →`}
      </button>
    </article>
  );
}
