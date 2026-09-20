import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { OrderModel } from "@/models/Order";
import type { OrderStatus } from "@/types/order";

export interface OrderScope {
  organizationId: string;
  branchId: string;
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

  /**
   * Generates the next human-facing order number for a branch, scoped to
   * the current day (e.g. "1051"). Uses findOneAndUpdate with $inc against
   * a per-branch-per-day counter document so concurrent POS terminals never
   * collide — see the Counter model referenced here.
   */
  async nextOrderNumber(scope: OrderScope): Promise<string> {
    await connectToDatabase();
    const { CounterModel } = await import("@/models/Counter");
    const dayKey = new Date().toISOString().slice(0, 10);
    const counterId = `order:${scope.branchId}:${dayKey}`;
    const counter = await CounterModel.findOneAndUpdate(
      { _id: counterId },
      { $inc: { value: 1 }, $setOnInsert: { organizationId: new Types.ObjectId(scope.organizationId) } },
      { upsert: true, new: true }
    );
    return String(counter.value).padStart(4, "0");
  },

  async create(orderDoc: Record<string, unknown>) {
    await connectToDatabase();
    return OrderModel.create(orderDoc);
  },
};
