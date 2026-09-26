import "server-only";
import { connectToDatabase } from "@/lib/db";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import { CustomerModel } from "@/models/Customer";
import { LoyaltyRewardModel } from "@/models/LoyaltyReward";
import { LoyaltyTransactionModel } from "@/models/LoyaltyTransaction";
import { requireBranchAccess, requirePermissions, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import type { ChangeLoyaltyPointsInput, CreateLoyaltyCustomerInput } from "@/validations/loyalty.schema";
import type { SaveLoyaltyRewardInput, SetLoyaltyRewardActiveInput } from "@/validations/loyalty-reward.schema";
import { AuditService } from "@/services/audit.service";

function requireCashierBranch(ctx: AuthContext) {
  requirePermissions(ctx, PERMISSIONS.POS_ACCESS);
  if (!ctx.activeBranchId) throw new BusinessRuleError("Choose an active branch before managing loyalty.");
  requireBranchAccess(ctx, ctx.activeBranchId);
  return ctx.activeBranchId;
}

export const LoyaltyService = {
  async createReward(ctx: AuthContext, input: SaveLoyaltyRewardInput) {
    requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS, PERMISSIONS.ORDERS_VIEW);
    await connectToDatabase();
    const reward = await LoyaltyRewardModel.create({
      organizationId: ctx.organizationId,
      name: input.name,
      description: input.description || undefined,
      pointsRequired: input.pointsRequired,
      isActive: true,
      createdBy: ctx.userId,
    });
    await AuditService.record({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      action: "loyalty.reward_created",
      entityType: "LoyaltyReward",
      entityId: String(reward._id),
      after: { name: reward.name, pointsRequired: reward.pointsRequired, isActive: reward.isActive },
    });
    return reward;
  },

  async setRewardActive(ctx: AuthContext, input: SetLoyaltyRewardActiveInput) {
    requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS, PERMISSIONS.ORDERS_VIEW);
    await connectToDatabase();
    const reward = await LoyaltyRewardModel.findOne({ _id: input.rewardId, organizationId: ctx.organizationId });
    if (!reward) throw new NotFoundError("Loyalty reward");
    const wasActive = reward.isActive;
    reward.isActive = input.isActive;
    reward.updatedBy = ctx.userId as unknown as typeof reward.updatedBy;
    await reward.save();
    await AuditService.record({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      action: input.isActive ? "loyalty.reward_activated" : "loyalty.reward_deactivated",
      entityType: "LoyaltyReward",
      entityId: String(reward._id),
      before: { isActive: wasActive },
      after: { name: reward.name, isActive: reward.isActive },
    });
    return reward;
  },

  async enroll(ctx: AuthContext, input: CreateLoyaltyCustomerInput) {
    const branchId = requireCashierBranch(ctx);
    await connectToDatabase();

    const match: Array<{ phone: string } | { email: string }> = [];
    if (input.phone) match.push({ phone: input.phone });
    if (input.email) match.push({ email: input.email });
    if (match.length) {
      const existing = await CustomerModel.findOne({ organizationId: ctx.organizationId, $or: match }).lean();
      if (existing) throw new ConflictError("A customer already exists with that phone number or email address.");
    }

    const customer = await CustomerModel.create({
      organizationId: ctx.organizationId,
      name: input.name,
      phone: input.phone || undefined,
      email: input.email || undefined,
      loyaltyPoints: 0,
      isActive: true,
    });

    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId,
      actorId: ctx.userId,
      action: "loyalty.member_enrolled",
      entityType: "Customer",
      entityId: String(customer._id),
      after: { name: customer.name, phone: customer.phone, email: customer.email },
    });
    return customer;
  },

  async changePoints(ctx: AuthContext, input: ChangeLoyaltyPointsInput) {
    const branchId = requireCashierBranch(ctx);
    await connectToDatabase();
    const customer = await CustomerModel.findOne({ _id: input.customerId, organizationId: ctx.organizationId, isActive: true });
    if (!customer) throw new NotFoundError("Customer");

    const change = input.type === "EARN" ? input.points : -input.points;
    const currentBalance = customer.loyaltyPoints ?? 0;
    if (change < 0 && currentBalance < Math.abs(change)) {
      throw new BusinessRuleError(`${customer.name} only has ${currentBalance} point${currentBalance === 1 ? "" : "s"} available.`);
    }

    const balanceAfter = currentBalance + change;
    customer.loyaltyPoints = balanceAfter;
    await customer.save();
    const transaction = await LoyaltyTransactionModel.create({
      organizationId: ctx.organizationId,
      branchId,
      customerId: customer._id,
      type: input.type,
      points: change,
      balanceAfter,
      reason: input.reason,
      createdBy: ctx.userId,
    });

    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId,
      actorId: ctx.userId,
      action: input.type === "EARN" ? "loyalty.points_earned" : "loyalty.points_redeemed",
      entityType: "Customer",
      entityId: String(customer._id),
      before: { loyaltyPoints: currentBalance },
      after: { loyaltyPoints: balanceAfter, pointsChanged: change, reason: input.reason, transactionId: String(transaction._id) },
    });

    return { customer, transaction };
  },
};
