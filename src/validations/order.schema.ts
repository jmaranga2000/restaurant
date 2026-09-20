import { z } from "zod";
import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHOD_CODES } from "@/types/order";

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
  notes: z.string().trim().max(500).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  applyTax: z.boolean().optional(),
  applyServiceCharge: z.boolean().optional(),
  submitMode: z.enum(["HOLD", "SEND_TO_KITCHEN"]).default("SEND_TO_KITCHEN"),
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

export const recordPaymentSchema = z.object({
  orderId: objectId,
  method: z.enum(PAYMENT_METHOD_CODES),
  amountMinor: z.number().int().positive("Enter a payment greater than zero."),
  reference: z.string().trim().max(120).optional(),
  note: z.string().trim().max(280).optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const refundPaymentSchema = z.object({
  orderId: objectId,
  method: z.enum(PAYMENT_METHOD_CODES),
  amountMinor: z.number().int().positive("Enter a refund greater than zero."),
  reference: z.string().trim().max(120).optional(),
  reason: z.string().trim().min(2, "Add a brief refund reason.").max(280),
});
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

export const transferTableSchema = z.object({
  orderId: objectId,
  tableId: objectId,
});

export const voidOrderSchema = z.object({
  orderId: objectId,
  reason: z.string().trim().min(2, "Add a brief reason.").max(280),
});

export const splitHeldOrderSchema = z.object({
  orderId: objectId,
  itemIds: z.array(objectId).min(1, "Select at least one item to split.").max(50),
});

export const mergeHeldOrdersSchema = z.object({
  primaryOrderId: objectId,
  secondaryOrderId: objectId,
}).refine((value) => value.primaryOrderId !== value.secondaryOrderId, "Choose two different held orders.");

export const updateKitchenItemsSchema = z.object({
  orderId: objectId,
  itemIds: z.array(objectId).min(1, "Select at least one kitchen item.").max(50),
  nextStatus: z.enum(["PREPARING", "READY", "COMPLETED"]),
});
