"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/auth.actions";
import { toClientError } from "@/lib/errors";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { LoyaltyService } from "@/services/loyalty.service";
import { changeLoyaltyPointsSchema, createLoyaltyCustomerSchema } from "@/validations/loyalty.schema";
import { saveLoyaltyRewardSchema, setLoyaltyRewardActiveSchema } from "@/validations/loyalty-reward.schema";

function revalidateLoyaltySurfaces() {
  revalidatePath("/pos");
  revalidatePath("/pos/loyalty");
  revalidatePath("/workspace/customers");
  revalidatePath("/workspace/loyalty");
}

export async function createLoyaltyRewardAction(input: unknown): Promise<ActionResult<{ rewardId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const reward = await LoyaltyService.createReward(ctx, saveLoyaltyRewardSchema.parse(input));
    revalidateLoyaltySurfaces();
    return { ok: true, data: { rewardId: String(reward._id) } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}

export async function setLoyaltyRewardActiveAction(input: unknown): Promise<ActionResult<{ rewardId: string; isActive: boolean }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const reward = await LoyaltyService.setRewardActive(ctx, setLoyaltyRewardActiveSchema.parse(input));
    revalidateLoyaltySurfaces();
    return { ok: true, data: { rewardId: String(reward._id), isActive: reward.isActive } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}

export async function createLoyaltyCustomerAction(input: unknown): Promise<ActionResult<{ customerId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const customer = await LoyaltyService.enroll(ctx, createLoyaltyCustomerSchema.parse(input));
    revalidateLoyaltySurfaces();
    return { ok: true, data: { customerId: String(customer._id) } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}

export async function changeLoyaltyPointsAction(input: unknown): Promise<ActionResult<{ customerId: string; balance: number }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const { customer } = await LoyaltyService.changePoints(ctx, changeLoyaltyPointsSchema.parse(input));
    revalidateLoyaltySurfaces();
    return { ok: true, data: { customerId: String(customer._id), balance: customer.loyaltyPoints ?? 0 } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}
