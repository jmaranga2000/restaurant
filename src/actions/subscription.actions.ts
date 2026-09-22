"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/auth.actions";
import { toClientError } from "@/lib/errors";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { SubscriptionService } from "@/services/subscription.service";
import { createSubscriptionRequestSchema } from "@/validations/subscription.schema";

export async function createSubscriptionRequestAction(input: unknown): Promise<ActionResult<{ requestId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const request = await SubscriptionService.requestPlan(ctx, createSubscriptionRequestSchema.parse(input));
    revalidatePath("/admin/subscription");
    return { ok: true, data: { requestId: String(request._id) } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}
