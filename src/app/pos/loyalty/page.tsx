import { EmptyState } from "@/components/ui/EmptyState";
import { connectToDatabase } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { CustomerModel } from "@/models/Customer";
import { LoyaltyRewardModel } from "@/models/LoyaltyReward";
import { LoyaltyTransactionModel } from "@/models/LoyaltyTransaction";
import { loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { LoyaltyClient } from "./LoyaltyClient";

export default async function LoyaltyPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.POS_ACCESS);

  if (!ctx.activeBranchId) {
    return <div className="p-4 sm:p-6 lg:p-8"><EmptyState icon="◎" title="Choose a branch first" description="Loyalty activity is recorded at the branch where the guest is being served." /></div>;
  }

  requireBranchAccess(ctx, ctx.activeBranchId);
  await connectToDatabase();
  const [members, transactions, rewards] = await Promise.all([
    CustomerModel.find({ organizationId: ctx.organizationId, isActive: true }).sort({ loyaltyPoints: -1, name: 1 }).limit(100).lean(),
    LoyaltyTransactionModel.find({ organizationId: ctx.organizationId }).sort({ createdAt: -1 }).limit(30).lean(),
    LoyaltyRewardModel.find({ organizationId: ctx.organizationId, isActive: true }).sort({ pointsRequired: 1, name: 1 }).lean(),
  ]);
  const memberNames = new Map(members.map((member) => [String(member._id), member.name]));

  return <LoyaltyClient
    members={members.map((member) => ({ id: String(member._id), name: member.name, phone: member.phone ?? undefined, email: member.email ?? undefined, points: member.loyaltyPoints ?? 0, joinedAt: member.createdAt.toISOString() }))}
    activity={transactions.map((transaction) => ({ id: String(transaction._id), customerId: String(transaction.customerId), customerName: memberNames.get(String(transaction.customerId)) ?? "Former customer", type: transaction.type, points: transaction.points, balanceAfter: transaction.balanceAfter, reason: transaction.reason, createdAt: transaction.createdAt.toISOString() }))}
    rewards={rewards.map((reward) => ({ id: String(reward._id), name: reward.name, description: reward.description ?? undefined, pointsRequired: reward.pointsRequired }))}
  />;
}
