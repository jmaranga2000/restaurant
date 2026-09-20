import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { BranchModel } from "@/models/Branch";
import { OrderModel } from "@/models/Order";
import { DisplayClient } from "./DisplayClient";

/**
 * `displayId` doubles as the branchId in this scaffold. A production build
 * would add a dedicated Display model (branchId, screen name, layout,
 * signage playlist) so displayId is an opaque, revocable identifier instead
 * of the branch's real database id — tracked as a follow-up, not hidden.
 */
export default async function DisplayPage({ params }: { params: { displayId: string } }) {
  await connectToDatabase();

  const branch = await BranchModel.findOne({ _id: params.displayId, isActive: true }).lean();
  if (!branch) notFound();

  const [waiting, ready] = await Promise.all([
    OrderModel.find({ branchId: branch._id, status: { $in: ["PLACED", "CONFIRMED", "PREPARING"] } })
      .select("orderNumber")
      .sort({ createdAt: 1 })
      .limit(20)
      .lean(),
    OrderModel.find({ branchId: branch._id, status: "READY" })
      .select("orderNumber")
      .sort({ createdAt: 1 })
      .limit(20)
      .lean(),
  ]);

  return (
    <DisplayClient
      branchName={branch.name}
      waitingOrderNumbers={waiting.map((o) => o.orderNumber)}
      readyOrderNumbers={ready.map((o) => o.orderNumber)}
    />
  );
}
