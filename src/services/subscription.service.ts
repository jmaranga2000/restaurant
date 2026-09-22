import "server-only";
import { connectToDatabase } from "@/lib/db";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptions";
import { SubscriptionRequestModel } from "@/models/SubscriptionRequest";
import { requirePermissions, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import type { CreateSubscriptionRequestInput } from "@/validations/subscription.schema";
import { AuditService } from "@/services/audit.service";

export const SubscriptionService = {
  async requestPlan(ctx: AuthContext, input: CreateSubscriptionRequestInput) {
    requirePermissions(ctx, PERMISSIONS.RESTAURANT_ADMIN_ACCESS, PERMISSIONS.SETTINGS_MANAGE);
    await connectToDatabase();
    const monthlyMinor = SUBSCRIPTION_PLANS[input.plan].monthlyMinor;
    const amountMinor = input.billingCycle === "ANNUAL" ? monthlyMinor * 10 : monthlyMinor;

    // Only one unresolved checkout request should be visible at a time. The
    // previous choice remains in the audit trail but no longer appears as an
    // amount the restaurant still needs to pay.
    await SubscriptionRequestModel.updateMany(
      { organizationId: ctx.organizationId, status: "PENDING" },
      { $set: { status: "CANCELLED" } }
    );
    const request = await SubscriptionRequestModel.create({
      organizationId: ctx.organizationId,
      plan: input.plan,
      billingCycle: input.billingCycle,
      paymentMethod: input.paymentMethod,
      billingEmail: input.billingEmail,
      mpesaPhone: input.paymentMethod === "MPESA" ? input.mpesaPhone || undefined : undefined,
      amountMinor,
      currency: "KES",
      status: "PENDING",
      createdBy: ctx.userId,
    });
    await AuditService.record({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      action: "subscription.requested",
      entityType: "SubscriptionRequest",
      entityId: String(request._id),
      after: { plan: input.plan, billingCycle: input.billingCycle, paymentMethod: input.paymentMethod, amountMinor },
    });
    return request;
  },
};
