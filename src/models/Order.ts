import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ORDER_STATUSES, ORDER_TYPES } from "@/types/order";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId },
    nameSnapshot: { type: String, required: true }, // captured at order time — product can change later
    unitPriceMinor: { type: Number, required: true }, // captured at order time
    quantity: { type: Number, required: true, min: 1 },
    modifiers: [
      {
        name: { type: String, required: true },
        priceMinor: { type: Number, required: true },
      },
    ],
    notes: { type: String, trim: true },
    kitchenStation: { type: String },
    itemStatus: {
      type: String,
      enum: ["NEW", "PREPARING", "READY", "COMPLETED"],
      default: "NEW",
    },
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    orderNumber: { type: String, required: true }, // human-facing sequential number, per branch per day
    orderType: { type: String, enum: ORDER_TYPES, required: true },
    status: { type: String, enum: ORDER_STATUSES, required: true, default: "DRAFT" },
    tableId: { type: Schema.Types.ObjectId, ref: "Table" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    items: { type: [orderItemSchema], default: [] },

    subtotalMinor: { type: Number, required: true, default: 0 },
    discountMinor: { type: Number, required: true, default: 0 },
    taxMinor: { type: Number, required: true, default: 0 },
    serviceChargeMinor: { type: Number, required: true, default: 0 },
    totalMinor: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "KES" },

    payments: [
      {
        method: { type: String, enum: ["CASH", "CARD", "MOBILE_MONEY", "BANK", "EXTERNAL"], required: true },
        amountMinor: { type: Number, required: true },
        reference: { type: String },
        receivedAt: { type: Date, default: Date.now },
      },
    ],

    idempotencyKey: { type: String }, // prevents duplicate order creation on retried POS submits
    cashierSessionId: { type: Schema.Types.ObjectId, ref: "CashierSession" },
    placedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    cancelledReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

orderSchema.index({ organizationId: 1, branchId: 1, status: 1, createdAt: -1 });
orderSchema.index({ organizationId: 1, branchId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ organizationId: 1, customerId: 1, createdAt: -1 });
orderSchema.index({ organizationId: 1, branchId: 1, idempotencyKey: 1 }, { sparse: true, unique: true });

export type Order = InferSchemaType<typeof orderSchema>;
export const OrderModel: Model<Order> = models.Order || model<Order>("Order", orderSchema);
