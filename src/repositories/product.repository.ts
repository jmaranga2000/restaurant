import "server-only";
import { connectToDatabase } from "@/lib/db";
import { ProductModel } from "@/models/Product";

export const ProductRepository = {
  async findById(organizationId: string, productId: string) {
    await connectToDatabase();
    return ProductModel.findOne({ _id: productId, organizationId, isActive: true }).lean();
  },

  async findManyByIds(organizationId: string, productIds: string[]) {
    await connectToDatabase();
    return ProductModel.find({
      organizationId,
      _id: { $in: productIds },
      isActive: true,
    }).lean();
  },

  async listByCategory(organizationId: string, categoryId?: string) {
    await connectToDatabase();
    return ProductModel.find({
      organizationId,
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
    })
      .sort({ name: 1 })
      .lean();
  },
};
