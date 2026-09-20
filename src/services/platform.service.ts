import "server-only";
import { connectToDatabase } from "@/lib/db";
import { OrganizationModel } from "@/models/Organization";
import { BranchModel } from "@/models/Branch";
import { UserModel } from "@/models/User";
import { RoleModel } from "@/models/Role";
import { OrderModel } from "@/models/Order";
import { NotFoundError } from "@/lib/errors";

export const PlatformService = {
  async getDashboardSummary() {
    await connectToDatabase();

    const [organizations, activeOrganizations, branches, activeBranches, users, orders, revenue] = await Promise.all([
      OrganizationModel.countDocuments(),
      OrganizationModel.countDocuments({ isActive: true }),
      BranchModel.countDocuments(),
      BranchModel.countDocuments({ isActive: true }),
      UserModel.countDocuments({ isActive: true }),
      OrderModel.countDocuments(),
      OrderModel.aggregate([{ $match: { status: { $nin: ["CANCELLED", "DRAFT"] } } }, { $group: { _id: null, total: { $sum: "$totalMinor" } } }]),
    ]);

    const recentOrganizations = await OrganizationModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      organizations,
      activeOrganizations,
      suspendedOrganizations: organizations - activeOrganizations,
      branches,
      activeBranches,
      activeUsers: users,
      orders,
      revenueMinor: revenue[0]?.total ?? 0,
      recentOrganizations: recentOrganizations.map((organization) => ({
        id: String(organization._id),
        name: organization.name,
        slug: organization.slug,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
      })),
    };
  },

  async listOrganizations() {
    await connectToDatabase();
    const orgs = await OrganizationModel.find().sort({ createdAt: -1 }).lean();

    const counts = await Promise.all(
      orgs.map(async (org) => {
        const [branchCount, userCount, orderCount] = await Promise.all([
          BranchModel.countDocuments({ organizationId: org._id }),
          UserModel.countDocuments({ organizationId: org._id }),
          OrderModel.countDocuments({ organizationId: org._id }),
        ]);
        return { branchCount, userCount, orderCount };
      })
    );

    return orgs.map((org, i) => ({
      id: String(org._id),
      name: org.name,
      slug: org.slug,
      isActive: org.isActive,
      defaultCurrency: org.defaultCurrency,
      defaultTimezone: org.defaultTimezone,
      createdAt: org.createdAt,
      ...counts[i],
    }));
  },

  async listBranches() {
    await connectToDatabase();
    const branches = await BranchModel.find().populate("organizationId", "name").sort({ createdAt: -1 }).lean();
    return branches.map((branch) => ({
      id: String(branch._id),
      name: branch.name,
      code: branch.code,
      address: branch.address ?? "—",
      isActive: branch.isActive,
      organizationId: String(branch.organizationId),
      organizationName: (branch.organizationId as unknown as { name?: string } | null)?.name ?? "—",
      createdAt: branch.createdAt,
    }));
  },

  async listUsers() {
    await connectToDatabase();
    const users = await UserModel.find().populate("organizationId", "name").populate("roleId", "name").sort({ createdAt: -1 }).lean();
    return users.map((user) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      organizationId: String(user.organizationId),
      organizationName: (user.organizationId as unknown as { name?: string } | null)?.name ?? "—",
      role: (user.roleId as unknown as { name?: string } | null)?.name ?? "—",
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    }));
  },

  async getOrganizationDetail(organizationId: string) {
    await connectToDatabase();
    const org = await OrganizationModel.findById(organizationId).lean();
    if (!org) throw new NotFoundError("Organization");

    const [branches, users] = await Promise.all([
      BranchModel.find({ organizationId }).lean(),
      UserModel.find({ organizationId }).populate("roleId", "name slug").lean(),
    ]);

    return {
      id: String(org._id),
      name: org.name,
      slug: org.slug,
      isActive: org.isActive,
      defaultCurrency: org.defaultCurrency,
      defaultTimezone: org.defaultTimezone,
      createdAt: org.createdAt,
      branches: branches.map((b) => ({ id: String(b._id), name: b.name, code: b.code, isActive: b.isActive })),
      users: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        isActive: u.isActive,
        role: (u.roleId as unknown as { name: string } | null)?.name ?? "—",
      })),
    };
  },

  /**
   * Suspending an org is reversible and non-destructive: it flips
   * isActive, and loadAuthContext() checks that flag on every request, so
   * every tenant user is locked out on their very next request without
   * any data being deleted.
   */
  async setOrganizationActive(organizationId: string, isActive: boolean) {
    await connectToDatabase();
    const org = await OrganizationModel.findByIdAndUpdate(organizationId, { isActive }, { new: true });
    if (!org) throw new NotFoundError("Organization");
    return org;
  },
};
