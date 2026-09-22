"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { RoleModel } from "@/models/Role";
import { OrganizationModel } from "@/models/Organization";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { setSessionCookie, clearSessionCookie, requireSession } from "@/lib/session";
import { loginSchema, registerOrganizationSchema, unlockRoleWorkspaceSchema } from "@/validations/auth.schema";
import { toClientError, AuthenticationError, RateLimitError, ConflictError } from "@/lib/errors";
import { consumeAuthRateLimit, rateLimitMessage, resetAuthRateLimit } from "@/lib/rate-limit";
import { DEFAULT_ROLE_TEMPLATES } from "@/types/permissions";
import type { Permission } from "@/types/permissions";
import { synchronizeSystemRoles } from "@/services/role.service";
import { defaultPortalFor } from "@/lib/portal-access";

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

    await synchronizeSystemRoles(String(user.organizationId));
    const role = await RoleModel.findOne({ _id: user.roleId, organizationId: user.organizationId }).select("slug").lean();
    if (!role) throw new AuthenticationError("This account no longer has an assigned role.");
    if (role.slug !== "owner") throw new AuthenticationError("Ask the restaurant owner to open the organization first, then choose your role from the access screen.");

    await resetAuthRateLimit(rateLimit.key);

    user.lastLoginAt = new Date();
    await user.save();

    await setSessionCookie({
      userId: String(user._id),
      organizationId: String(user.organizationId),
      activeBranchId: user.assignedBranchIds[0] ? String(user.assignedBranchIds[0]) : null,
    });

    const organization = await OrganizationModel.findById(user.organizationId).select("onboarding").lean();
    const redirectTo: string = organization?.onboarding?.status === "IN_PROGRESS"
      ? "/onboarding"
      : "/choose-workspace";
    return { ok: true, data: { redirectTo } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}

/**
 * The organization owner opens the restaurant first. A member then selects
 * their role on the shared access screen and unlocks only that workspace with
 * their own account password. This keeps role selection useful on a shared
 * device without turning a role into a shared credential.
 */
export async function unlockRoleWorkspaceAction(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const session = await requireSession();
    const parsed = unlockRoleWorkspaceSchema.parse(input);
    const rateLimit = await consumeAuthRateLimit({
      scope: "role-unlock",
      requestHeaders: headers(),
      email: parsed.email,
    });
    if (!rateLimit.allowed) throw new RateLimitError(rateLimitMessage(rateLimit.retryAfterSeconds));

    await connectToDatabase();
    const organization = await OrganizationModel.findOne({ _id: session.organizationId, isActive: true }).select("_id").lean();
    if (!organization) throw new AuthenticationError("This restaurant is not currently available.");

    const user = await UserModel.findOne({ organizationId: session.organizationId, email: parsed.email, isActive: true }).select("+passwordHash");
    if (!user) throw new AuthenticationError("Incorrect role, email, or password.");
    const role = await RoleModel.findOne({ _id: user.roleId, organizationId: session.organizationId, slug: parsed.roleSlug }).lean();
    if (!role) throw new AuthenticationError("This account is not assigned to the selected role.");
    if (!await verifyPassword(parsed.password, user.passwordHash)) throw new AuthenticationError("Incorrect role, email, or password.");

    await resetAuthRateLimit(rateLimit.key);
    user.lastLoginAt = new Date();
    await user.save();
    await setSessionCookie({
      userId: String(user._id),
      organizationId: String(user.organizationId),
      activeBranchId: user.assignedBranchIds[0] ? String(user.assignedBranchIds[0]) : null,
    });
    return { ok: true, data: { redirectTo: defaultPortalFor(role.permissions as Permission[]) } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}

export async function logoutAction(): Promise<void> {
  clearSessionCookie();
  // A portal route requires a session. Redirect in the same server action so
  // React never attempts to re-render the protected page after its cookie is gone.
  redirect("/");
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

    const [existingOrganization, existingUser] = await Promise.all([
      OrganizationModel.exists({ slug }),
      UserModel.exists({ email: parsed.email }),
    ]);
    if (existingOrganization) throw new ConflictError("A restaurant with that name already exists. Try a more specific name.");
    if (existingUser) throw new ConflictError("An account already uses this email address. Sign in instead.");

    const org = await OrganizationModel.create({
      name: parsed.organizationName,
      slug,
      onboarding: { status: "IN_PROGRESS", skippedSteps: [] },
      subscription: { plan: "TRIAL", status: "TRIAL", enabledModules: [] },
    });

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

    return { ok: true, data: { redirectTo: "/onboarding" } };
  } catch (err) {
    return { ok: false, error: toClientError(err) };
  }
}
