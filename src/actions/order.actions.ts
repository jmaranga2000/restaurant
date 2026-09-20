"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { OrderService } from "@/services/order.service";
import { createOrderSchema, updateOrderStatusSchema } from "@/validations/order.schema";
import { toClientError } from "@/lib/errors";
import type { ActionResult } from "@/actions/auth.actions";

export async function createOrderAction(input: unknown): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = createOrderSchema.parse(input);

    const order = await OrderService.createOrder(ctx, parsed);

    revalidatePath("/pos");
    revalidatePath("/kitchen");
    return { ok: true, data: { orderId: String(order._id), orderNumber: order.orderNumber } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function updateOrderStatusAction(input: unknown): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = updateOrderStatusSchema.parse(input);

    const order = await OrderService.transitionStatus(ctx, parsed.orderId, parsed.nextStatus, parsed.reason);

    revalidatePath("/kitchen");
    revalidatePath("/pos");
    revalidatePath(`/display/${order.branchId}`);
    return { ok: true, data: { status: order.status } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}
