"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { InventoryService } from "@/services/inventory.service";
import { createInventoryItemSchema, recordManualMovementSchema } from "@/validations/inventory.schema";
import { toClientError } from "@/lib/errors";
import type { ActionResult } from "@/actions/auth.actions";

export async function createInventoryItemAction(formData: FormData): Promise<ActionResult<{ ok: true }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    if (!ctx.activeBranchId) throw new Error("No active branch selected for this session.");

    const parsed = createInventoryItemSchema.parse({
      branchId: ctx.activeBranchId,
      name: formData.get("name"),
      unit: formData.get("unit"),
      minimumStock: Number(formData.get("minimumStock") || 0),
      reorderLevel: Number(formData.get("reorderLevel") || 0),
    });

    await InventoryService.createItem(ctx, parsed);
    revalidatePath("/inventory");
    return { ok: true, data: { ok: true } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function recordManualMovementAction(input: unknown): Promise<ActionResult<{ ok: true }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = recordManualMovementSchema.parse(input);

    await InventoryService.recordManualMovement(ctx, parsed);
    revalidatePath("/inventory");
    return { ok: true, data: { ok: true } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}
