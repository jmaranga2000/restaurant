import "server-only";
import { connectToDatabase } from "@/lib/db";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import { CustomerModel } from "@/models/Customer";
import { LoyaltyTransactionModel } from "@/models/LoyaltyTransaction";
import { requireBranchAccess, requirePermissions, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import type { ChangeLoyaltyPointsInput, CreateLoyaltyCustomerInput } from "@/validations/loyalty.schema";
import { AuditService } from "@/services/audit.service";

function requireCashierBranch(ctx: AuthContext) {
  requirePermissions(ctx, PERMISSIONS.POS_ACCESS);
  if (!ctx.activeBranchId) throw new BusinessRuleError("Choose an active branch before managing loyalty.");
  requireBranchAccess(ctx, ctx.activeBranchId);
  return ctx.activeBranchId;
}

export const LoyaltyService = {
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
