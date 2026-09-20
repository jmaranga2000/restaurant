import "server-only";
import { connectToDatabase } from "@/lib/db";
import { BranchModel } from "@/models/Branch";

export const BranchRepository = {
  async listByOrganization(organizationId: string) {
    await connectToDatabase();
    return BranchModel.find({ organizationId }).sort({ name: 1 }).lean();
  },

  async findManyByIds(organizationId: string, branchIds: string[]) {
    await connectToDatabase();
    return BranchModel.find({ organizationId, _id: { $in: branchIds }, isActive: true }).sort({ name: 1 }).lean();
  },

  async findById(organizationId: string, branchId: string) {
    await connectToDatabase();
    return BranchModel.findOne({ _id: branchId, organizationId });
  },

  async create(doc: Record<string, unknown>) {
    await connectToDatabase();
    return BranchModel.create(doc);
  },

  async codeExists(organizationId: string, code: string) {
    await connectToDatabase();
    const existing = await BranchModel.findOne({ organizationId, code }).lean();
    return Boolean(existing);
  },
};
