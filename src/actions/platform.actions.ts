"use server";

import { connectToDatabase } from "@/lib/db";
import { PlatformAdminModel } from "@/models/PlatformAdmin";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { setPlatformSessionCookie, clearPlatformSessionCookie, requirePlatformSession } from "@/lib/platform-session";
import { loginSchema } from "@/validations/auth.schema";
import { PlatformService } from "@/services/platform.service";
import { toClientError, AuthenticationError } from "@/lib/errors";
import type { ActionResult } from "@/actions/auth.actions";

export async function platformLoginAction(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    await connectToDatabase();
    const admin = await PlatformAdminModel.findOne({ email: parsed.email, isActive: true }).select("+passwordHash");
    if (!admin) throw new AuthenticationError("Incorrect email or password.");

    const valid = await verifyPassword(parsed.password, admin.passwordHash);
    if (!valid) throw new AuthenticationError("Incorrect email or password.");

    admin.lastLoginAt = new Date();
    await admin.save();

    await setPlatformSessionCookie({ platformAdminId: String(admin._id) });
    return { ok: true, data: { redirectTo: "/super-admin/organizations" } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function platformLogoutAction(): Promise<void> {
  clearPlatformSessionCookie();
}

export async function setOrganizationActiveAction(
  organizationId: string,
  isActive: boolean
): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    await requirePlatformSession(); // every platform admin may do this — there's only one platform role for now
    const org = await PlatformService.setOrganizationActive(organizationId, isActive);
    return { ok: true, data: { isActive: org.isActive } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}
