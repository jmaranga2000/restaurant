export const ORDER_STATUSES = [
  "DRAFT",
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "COLLECTED",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "VOIDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "PICKUP", "DELIVERY"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

/** Kitchen progress belongs to individual order items so Grill, Fryer, and
 * Drinks can work one customer order independently. The broader order status
 * remains the commercial source of truth. */
export const KITCHEN_ITEM_STATUSES = ["NEW", "PREPARING", "READY", "COMPLETED"] as const;
export type KitchenItemStatus = (typeof KITCHEN_ITEM_STATUSES)[number];

/**
 * These are deliberately restaurant-facing codes. The payment gateway or
 * processor behind a method may change, but a cashier should always see the
 * payment language configured by their restaurant.
 */
export const PAYMENT_METHOD_CODES = ["CASH", "MPESA", "CARD", "BANK", "OTHER"] as const;
export type PaymentMethodCode = (typeof PAYMENT_METHOD_CODES)[number];

/**
 * The single source of truth for which status transitions are legal.
 * Nothing in the app should move an order's status without going through
 * OrderService.transition(), which consults this map — see section 9 of the
 * platform spec: "Do not allow arbitrary status transitions."
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["PLACED", "VOIDED"],
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "COLLECTED", "OUT_FOR_DELIVERY"],
  SERVED: ["COMPLETED"],
  COLLECTED: ["COMPLETED"],
  OUT_FOR_DELIVERY: ["COMPLETED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
  VOIDED: [],
};

/** Pure, DB-free check — kept separate from OrderService so it's trivially unit-testable. */
export function canTransition(current: OrderStatus, next: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[current].includes(next);
}

export interface OrderItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  modifiers?: { id: string; name: string; priceMinor: number }[];
  notes?: string;
}
