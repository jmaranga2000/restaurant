import { z } from "zod";
import { ORDER_STATUSES, ORDER_TYPES } from "@/types/order";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id.");

export const createOrderItemSchema = z.object({
  productId: objectId,
  variantId: objectId.optional(),
  quantity: z.number().int().min(1).max(50),
  modifierOptionIds: z.array(objectId).max(20).default([]),
  notes: z.string().trim().max(280).optional(),
});

export const createOrderSchema = z.object({
  branchId: objectId,
  orderType: z.enum(ORDER_TYPES),
  tableId: objectId.optional(),
  customerId: objectId.optional(),
  items: z.array(createOrderItemSchema).min(1, "An order needs at least one item."),
  // Client may send one for its own retry logic, but the server always
  // enforces uniqueness per branch — see Order.idempotencyKey index.
  idempotencyKey: z.string().uuid().optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Note: unitPriceMinor, subtotalMinor, taxMinor, totalMinor are deliberately
// NOT accepted from the client anywhere in this schema. OrderService prices
// every line item itself from the current Product record.

export const updateOrderStatusSchema = z.object({
  orderId: objectId,
  nextStatus: z.enum(ORDER_STATUSES),
  reason: z.string().trim().max(280).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
