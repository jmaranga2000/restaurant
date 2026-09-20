import clsx from "clsx";
import type { OrderStatus } from "@/types/order";

const STATUS_STYLE: Record<OrderStatus, { label: string; dot: string; text: string }> = {
  DRAFT: { label: "Draft", dot: "bg-status-served", text: "text-status-served" },
  PLACED: { label: "Placed", dot: "bg-status-waiting", text: "text-status-waiting" },
  CONFIRMED: { label: "Confirmed", dot: "bg-status-waiting", text: "text-status-waiting" },
  PREPARING: { label: "Preparing", dot: "bg-status-preparing", text: "text-status-preparing" },
  READY: { label: "Ready", dot: "bg-status-ready", text: "text-status-ready" },
  SERVED: { label: "Served", dot: "bg-status-served", text: "text-status-served" },
  COLLECTED: { label: "Collected", dot: "bg-status-served", text: "text-status-served" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", dot: "bg-status-waiting", text: "text-status-waiting" },
  COMPLETED: { label: "Completed", dot: "bg-status-served", text: "text-status-served" },
  CANCELLED: { label: "Cancelled", dot: "bg-status-cancelled", text: "text-status-cancelled" },
  REFUNDED: { label: "Refunded", dot: "bg-status-cancelled", text: "text-status-cancelled" },
  VOIDED: { label: "Voided", dot: "bg-status-cancelled", text: "text-status-cancelled" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-sm font-medium", style.text)}>
      <span className={clsx("h-2 w-2 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}
