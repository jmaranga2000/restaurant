import "server-only";
import { connectToDatabase } from "@/lib/db";
import { OrderModel } from "@/models/Order";
import { Types } from "mongoose";

export interface TodaySummary {
  ordersToday: number;
  revenueTodayMinor: number;
  averageOrderValueMinor: number;
  pending: number;
  preparing: number;
  ready: number;
}

export interface BranchSummaryRow {
  branchId: string;
  branchName: string;
  branchCode: string;
  ordersToday: number;
  revenueTodayMinor: number;
}

export interface RangeSummary {
  ordersCompleted: number;
  revenueMinor: number;
  averageOrderValueMinor: number;
  cancelledCount: number;
  topProducts: { name: string; quantitySold: number; revenueMinor: number }[];
}

export const DashboardService = {
  async rangeSummary(
    organizationId: string,
    branchId: string,
    start: Date,
    end: Date
  ): Promise<RangeSummary> {
    await connectToDatabase();

    const [completedAgg, cancelledCount, topProducts] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(organizationId),
            branchId: new Types.ObjectId(branchId),
            status: "COMPLETED",
            createdAt: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, revenueMinor: { $sum: "$totalMinor" } } },
      ]),
      OrderModel.countDocuments({
        organizationId: new Types.ObjectId(organizationId),
        branchId: new Types.ObjectId(branchId),
        status: "CANCELLED",
        createdAt: { $gte: start, $lte: end },
      }),
      OrderModel.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(organizationId),
            branchId: new Types.ObjectId(branchId),
            status: "COMPLETED",
            createdAt: { $gte: start, $lte: end },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.nameSnapshot",
            quantitySold: { $sum: "$items.quantity" },
            revenueMinor: { $sum: { $multiply: ["$items.unitPriceMinor", "$items.quantity"] } },
          },
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const completed = completedAgg[0] ?? { count: 0, revenueMinor: 0 };

    return {
      ordersCompleted: completed.count,
      revenueMinor: completed.revenueMinor,
      averageOrderValueMinor: completed.count > 0 ? Math.round(completed.revenueMinor / completed.count) : 0,
      cancelledCount,
      topProducts: topProducts.map((p) => ({
        name: p._id as string,
        quantitySold: p.quantitySold,
        revenueMinor: p.revenueMinor,
      })),
    };
  },

  /**
   * One row per active branch in the org, for the Restaurant Admin
   * portal's cross-branch comparison (spec §7: "Branch comparison").
   */
  async orgWideSummaryByBranch(organizationId: string): Promise<BranchSummaryRow[]> {
    await connectToDatabase();
    const { BranchModel } = await import("@/models/Branch");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [branches, completedByBranch] = await Promise.all([
      BranchModel.find({ organizationId, isActive: true }).sort({ name: 1 }).lean(),
      OrderModel.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(organizationId),
            status: "COMPLETED",
            createdAt: { $gte: startOfDay },
          },
        },
        { $group: { _id: "$branchId", count: { $sum: 1 }, revenueMinor: { $sum: "$totalMinor" } } },
      ]),
    ]);

    const byBranch = new Map(completedByBranch.map((r) => [String(r._id), r]));

    return branches.map((b) => {
      const stats = byBranch.get(String(b._id));
      return {
        branchId: String(b._id),
        branchName: b.name,
        branchCode: b.code,
        ordersToday: stats?.count ?? 0,
        revenueTodayMinor: stats?.revenueMinor ?? 0,
      };
    });
  },

  async todaySummary(organizationId: string, branchId: string): Promise<TodaySummary> {
    await connectToDatabase();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [completedAgg, statusCounts] = await Promise.all([
      OrderModel.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(organizationId),
            branchId: new Types.ObjectId(branchId),
            status: "COMPLETED",
            createdAt: { $gte: startOfDay },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenueMinor: { $sum: "$totalMinor" },
          },
        },
      ]),
      OrderModel.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(organizationId),
            branchId: new Types.ObjectId(branchId),
            createdAt: { $gte: startOfDay },
            status: { $in: ["PLACED", "CONFIRMED", "PREPARING", "READY"] },
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const completed = completedAgg[0] ?? { count: 0, revenueMinor: 0 };
    const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.count])) as Record<string, number>;

    return {
      ordersToday: completed.count,
      revenueTodayMinor: completed.revenueMinor,
      averageOrderValueMinor: completed.count > 0 ? Math.round(completed.revenueMinor / completed.count) : 0,
      pending: (byStatus.PLACED ?? 0) + (byStatus.CONFIRMED ?? 0),
      preparing: byStatus.PREPARING ?? 0,
      ready: byStatus.READY ?? 0,
    };
  },
};
