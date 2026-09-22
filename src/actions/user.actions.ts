"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { UserService } from "@/services/user.service";
import { inviteUserSchema, updateUserSchema } from "@/validations/user.schema";
import { toClientError } from "@/lib/errors";
import type { ActionResult } from "@/actions/auth.actions";

export async function inviteUserAction(formData: FormData): Promise<ActionResult<{ userId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);

    const parsed = inviteUserSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      roleId: formData.get("roleId"),
      assignedBranchIds: formData.getAll("assignedBranchIds"),
      temporaryPassword: formData.get("temporaryPassword"),
    });

    const user = await UserService.invite(ctx, parsed);
    revalidatePath("/admin/users");
    revalidatePath("/admin/users/new");
    return { ok: true, data: { userId: String(user._id) } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function updateUserAction(input: unknown): Promise<ActionResult<{ userId: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    const parsed = updateUserSchema.parse(input);

    const user = await UserService.update(ctx, parsed);
    revalidatePath("/admin/users");
    return { ok: true, data: { userId: String(user._id) } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}
