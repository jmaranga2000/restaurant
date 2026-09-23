import "server-only";
import { randomInt } from "crypto";
import { connectToDatabase } from "@/lib/db";
import { OrderModel } from "@/models/Order";
import type { OrderStatus } from "@/types/order";

export interface OrderScope {
  organizationId: string;
  branchId: string;
  tableLabel?: string;
}

export const OrderRepository = {
  async findById(scope: OrderScope, orderId: string) {
    await connectToDatabase();
    return OrderModel.findOne({
      _id: orderId,
      organizationId: scope.organizationId,
      branchId: scope.branchId,
    });
  },

  async findByIdempotencyKey(scope: OrderScope, key: string) {
    await connectToDatabase();
    return OrderModel.findOne({
      organizationId: scope.organizationId,
      branchId: scope.branchId,
      idempotencyKey: key,
    }).lean();
  },

  async listByStatus(scope: OrderScope, statuses: OrderStatus[], limit = 100) {
    await connectToDatabase();
    return OrderModel.find({
      organizationId: scope.organizationId,
      branchId: scope.branchId,
      status: { $in: statuses },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
  },

  /** Generates a unique table-prefixed ticket number such as T01579. */
  async nextOrderNumber(scope: OrderScope): Promise<string> {
    await connectToDatabase();
    const tableDigits = scope.tableLabel?.match(/\d+/)?.[0] ?? "0";
    const tableCode = tableDigits.slice(-2).padStart(2, "0");
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const orderNumber = `T${tableCode}${String(randomInt(0, 1000)).padStart(3, "0")}`;
      const exists = await OrderModel.exists({ organizationId: scope.organizationId, branchId: scope.branchId, orderNumber });
      if (!exists) return orderNumber;
    }
    throw new Error("Could not generate a unique order number. Please try again.");
  },

  async create(orderDoc: Record<string, unknown>) {
    await connectToDatabase();
    return OrderModel.create(orderDoc);
  },
};
