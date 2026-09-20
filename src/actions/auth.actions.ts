"use server";

import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { RoleModel } from "@/models/Role";
import { OrganizationModel } from "@/models/Organization";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";
import { loginSchema, registerOrganizationSchema } from "@/validations/auth.schema";
import { toClientError, AuthenticationError, RateLimitError } from "@/lib/errors";
import { consumeAuthRateLimit, rateLimitMessage, resetAuthRateLimit } from "@/lib/rate-limit";
import { DEFAULT_ROLE_TEMPLATES } from "@/types/permissions";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { message: string; code: string } };

export async function loginAction(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    const rateLimit = await consumeAuthRateLimit({
      scope: "restaurant-login",
      requestHeaders: headers(),
      email: parsed.email,
    });
    if (!rateLimit.allowed) throw new RateLimitError(rateLimitMessage(rateLimit.retryAfterSeconds));

    await connectToDatabase();
    const user = await UserModel.findOne({ email: parsed.email, isActive: true }).select("+passwordHash");
    if (!user) throw new AuthenticationError("Incorrect email or password.");

    const valid = await verifyPassword(parsed.password, user.passwordHash);
    if (!valid) throw new AuthenticationError("Incorrect email or password.");

    await resetAuthRateLimit(rateLimit.key);

    user.lastLoginAt = new Date();
    await user.save();

    await setSessionCookie({
      userId: String(user._id),
      organizationId: String(user.organizationId),
      activeBranchId: user.assignedBranchIds[0] ? String(user.assignedBranchIds[0]) : null,
    });

    return { ok: true, data: { redirectTo: "/dashboard" } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

export async function logoutAction(): Promise<void> {
  clearSessionCookie();
}

/**
 * Registers a brand-new organization plus its first user, who becomes the
 * "owner" with every permission. Seeds the default role templates so the
 * owner can immediately invite branch managers, cashiers, and kitchen staff.
 */
export async function registerOrganizationAction(
  formData: FormData
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = registerOrganizationSchema.parse({
      organizationName: formData.get("organizationName"),
      ownerName: formData.get("ownerName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    const rateLimit = await consumeAuthRateLimit({
      scope: "organization-registration",
      requestHeaders: headers(),
      email: parsed.email,
    });
    if (!rateLimit.allowed) throw new RateLimitError(rateLimitMessage(rateLimit.retryAfterSeconds));

    await connectToDatabase();

    const slug = parsed.organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const org = await OrganizationModel.create({ name: parsed.organizationName, slug });

    const roleDocs = await RoleModel.insertMany(
      Object.entries(DEFAULT_ROLE_TEMPLATES).map(([slugName, permissions]) => ({
        organizationId: org._id,
        name: slugName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: slugName,
        permissions,
        isSystemRole: true,
      }))
    );
    const ownerRole = roleDocs.find((r) => r.slug === "owner")!;

    const passwordHash = await hashPassword(parsed.password);
    const owner = await UserModel.create({
      organizationId: org._id,
      name: parsed.ownerName,
      email: parsed.email,
      passwordHash,
      roleId: ownerRole._id,
      assignedBranchIds: [],
      isEmailVerified: false,
    });

    await setSessionCookie({
      userId: String(owner._id),
      organizationId: String(org._id),
      activeBranchId: null,
    });

    await resetAuthRateLimit(rateLimit.key);

    return { ok: true, data: { redirectTo: "/dashboard" } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}
