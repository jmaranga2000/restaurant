import "server-only";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";

export const UserRepository = {
  async listByOrganization(organizationId: string) {
    await connectToDatabase();
    return UserModel.find({ organizationId }).populate("roleId", "name slug").sort({ name: 1 }).lean();
  },

  async findById(organizationId: string, userId: string) {
    await connectToDatabase();
    // Password hashes are never returned to a client. They are selected here
    // only so an authorized restaurant administrator can replace a password.
    return UserModel.findOne({ _id: userId, organizationId }).select("+passwordHash");
  },

  async emailExists(organizationId: string, email: string) {
    await connectToDatabase();
    const existing = await UserModel.findOne({ organizationId, email }).lean();
    return Boolean(existing);
  },

  async create(doc: Record<string, unknown>) {
    await connectToDatabase();
    return UserModel.create(doc);
  },
};
