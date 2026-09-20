"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { OrderService } from "@/services/order.service";
import {
  createOrderSchema,
  mergeHeldOrdersSchema,
  recordPaymentSchema,
  refundPaymentSchema,
  splitHeldOrderSchema,
  transferTableSchema,
  updateOrderStatusSchema,
  voidOrderSchema,
} from "@/validations/order.schema";
import { toClientError } from "@/lib/errors";
import type { ActionResult } from "@/actions/auth.actions";

export async function createOrderAction(input: unknown): Promise<ActionResult<{ orderId: string; orderNumber: string; status: string; totalMinor: number }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = createOrderSchema.parse(input);

    const order = await OrderService.createOrder(ctx, parsed);

    revalidatePath("/pos");
    revalidatePath("/kitchen");
    return { ok: true, data: { orderId: String(order._id), orderNumber: order.orderNumber, status: order.status, totalMinor: order.totalMinor } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

function revalidatePosSurfaces() {
  revalidatePath("/pos");
  revalidatePath("/kitchen");
  revalidatePath("/workspace");
}

export async function sendHeldOrderAction(input: unknown): Promise<ActionResult<{ orderId: string; orderNumber: string; status: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = updateOrderStatusSchema.pick({ orderId: true }).parse(input);
    const order = await OrderService.sendHeldOrder(ctx, parsed.orderId);
    revalidatePosSurfaces();
    return { ok: true, data: { orderId: String(order._id), orderNumber: order.orderNumber, status: order.status } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function recordPaymentAction(input: unknown): Promise<ActionResult<{ totalPaidMinor: number; balanceMinor: number }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = recordPaymentSchema.parse(input);
    const payment = await OrderService.recordPayment(ctx, parsed);
    revalidatePosSurfaces();
    return { ok: true, data: { totalPaidMinor: payment.totalPaidMinor, balanceMinor: payment.balanceMinor } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function refundPaymentAction(input: unknown): Promise<ActionResult<{ totalPaidMinor: number; balanceMinor: number }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = refundPaymentSchema.parse(input);
    const refund = await OrderService.refundPayment(ctx, parsed);
    revalidatePosSurfaces();
    return { ok: true, data: { totalPaidMinor: refund.totalPaidMinor, balanceMinor: refund.balanceMinor } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function transferOrderTableAction(input: unknown): Promise<ActionResult<{ tableId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = transferTableSchema.parse(input);
    const order = await OrderService.transferTable(ctx, parsed.orderId, parsed.tableId);
    revalidatePosSurfaces();
    return { ok: true, data: { tableId: String(order.tableId) } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function voidOrderAction(input: unknown): Promise<ActionResult<{ status: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = voidOrderSchema.parse(input);
    const order = await OrderService.voidOrder(ctx, parsed.orderId, parsed.reason);
    revalidatePosSurfaces();
    return { ok: true, data: { status: order.status } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function splitHeldOrderAction(input: unknown): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = splitHeldOrderSchema.parse(input);
    const order = await OrderService.splitHeldOrder(ctx, parsed.orderId, parsed.itemIds);
    revalidatePosSurfaces();
    return { ok: true, data: { orderId: String(order._id), orderNumber: order.orderNumber } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function mergeHeldOrdersAction(input: unknown): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = mergeHeldOrdersSchema.parse(input);
    const order = await OrderService.mergeHeldOrders(ctx, parsed.primaryOrderId, parsed.secondaryOrderId);
    revalidatePosSurfaces();
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
