"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requireBranchAccess } from "@/permissions/authorize";
import { BranchService } from "@/services/branch.service";
import { createBranchSchema, updateBranchSchema } from "@/validations/branch.schema";
import { toClientError } from "@/lib/errors";
import type { ActionResult } from "@/actions/auth.actions";

export async function createBranchAction(formData: FormData): Promise<ActionResult<{ branchId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = createBranchSchema.parse({
      name: formData.get("name"),
      code: formData.get("code"),
      address: formData.get("address") || undefined,
      timezone: formData.get("timezone") || undefined,
    });

    const branch = await BranchService.create(ctx, parsed);
    revalidatePath("/admin/branches");
    return { ok: true, data: { branchId: String(branch._id) } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function updateBranchAction(input: unknown): Promise<ActionResult<{ branchId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = updateBranchSchema.parse(input);

    const branch = await BranchService.update(ctx, parsed);
    revalidatePath("/admin/branches");
    return { ok: true, data: { branchId: String(branch._id) } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

/** Lets a user assigned to more than one branch switch which branch their session is scoped to. */
export async function switchActiveBranchAction(branchId: string): Promise<ActionResult<{ branchId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    requireBranchAccess(ctx, branchId);

    const { setSessionCookie } = await import("@/lib/session");
    await setSessionCookie({ userId: ctx.userId, organizationId: ctx.organizationId, activeBranchId: branchId });

    revalidatePath("/dashboard");
    revalidatePath("/pos");
    revalidatePath("/kitchen");
    return { ok: true, data: { branchId } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}
