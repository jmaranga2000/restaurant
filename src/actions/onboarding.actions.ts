"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, setSessionCookie } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { OrganizationModel } from "@/models/Organization";
import { BranchModel } from "@/models/Branch";
import { TableModel } from "@/models/Table";
import { CategoryModel } from "@/models/Product";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { onboardingDraftSchema, onboardingSchema } from "@/validations/onboarding.schema";
import { toClientError, ValidationError } from "@/lib/errors";
import type { ActionResult } from "@/actions/auth.actions";

const paymentLabels = { CASH: "Cash", MPESA: "M-Pesa", CARD: "Card", BANK: "Bank transfer", OTHER: "Other" } as const;
const defaultCategories = ["Starters", "Mains", "Desserts", "Drinks"];

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function payloadFrom(formData: FormData) {
  return {
    restaurantName: text(formData, "restaurantName"), description: text(formData, "description"), phone: text(formData, "phone"), email: text(formData, "email"),
    address: text(formData, "address"), city: text(formData, "city"), country: text(formData, "country"), currency: text(formData, "currency"), timezone: text(formData, "timezone"),
    taxRatePercent: text(formData, "taxRatePercent"), serviceChargePercent: text(formData, "serviceChargePercent"), taxLabel: text(formData, "taxLabel"), pricesIncludeTax: formData.get("pricesIncludeTax") === "on",
    receiptHeader: text(formData, "receiptHeader"), receiptFooter: text(formData, "receiptFooter"), receiptPrefix: text(formData, "receiptPrefix"), legalName: text(formData, "legalName"),
    registrationNumber: text(formData, "registrationNumber"), taxNumber: text(formData, "taxNumber"), branchName: text(formData, "branchName"), branchCode: text(formData, "branchCode"),
    branchAddress: text(formData, "branchAddress"), branchPhone: text(formData, "branchPhone"), opensAt: text(formData, "opensAt"), closesAt: text(formData, "closesAt"),
    tableCount: text(formData, "tableCount"), serviceTypes: formData.getAll("serviceTypes"), paymentMethods: formData.getAll("paymentMethods"),
  };
}

async function logoDataUrl(formData: FormData) {
  const logo = formData.get("logo");
  if (!(logo instanceof File) || logo.size === 0) return undefined;
  if (!logo.type.startsWith("image/")) throw new ValidationError("Upload an image file for the restaurant logo.");
  if (logo.size > 750_000) throw new ValidationError("Keep the restaurant logo under 750 KB.");
  const buffer = Buffer.from(await logo.arrayBuffer());
  return `data:${logo.type};base64,${buffer.toString("base64")}`;
}

async function saveOnboarding(formData: FormData, complete: boolean): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const session = await requireSession();
    const ctx = await loadAuthContext(session);
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
    const raw = payloadFrom(formData);
    const parsed = complete ? onboardingSchema.parse(raw) : onboardingDraftSchema.parse(raw);
    const logoUrl = await logoDataUrl(formData);

    await connectToDatabase();
    const organization = await OrganizationModel.findById(ctx.organizationId);
    if (!organization) throw new ValidationError("Your restaurant could not be found.");

    if (parsed.restaurantName) organization.name = parsed.restaurantName;
    if (parsed.description !== undefined) organization.description = parsed.description || undefined;
    if (parsed.phone !== undefined) organization.phone = parsed.phone || undefined;
    if (parsed.email !== undefined) organization.email = parsed.email || undefined;
    if (parsed.address !== undefined) organization.address = parsed.address || undefined;
    if (parsed.city !== undefined) organization.city = parsed.city || undefined;
    if (parsed.country !== undefined) organization.country = parsed.country || undefined;
    if (parsed.currency) organization.defaultCurrency = parsed.currency;
    if (parsed.timezone) organization.defaultTimezone = parsed.timezone;
    if (logoUrl) organization.logoUrl = logoUrl;

    if (complete) {
      organization.settings = {
        taxRatePercent: parsed.taxRatePercent,
        serviceChargePercent: parsed.serviceChargePercent,
        taxLabel: parsed.taxLabel || "VAT",
        pricesIncludeTax: parsed.pricesIncludeTax ?? false,
        serviceTypes: parsed.serviceTypes,
        paymentMethods: parsed.paymentMethods.map((code) => ({ code, label: paymentLabels[code], enabled: true })),
        kitchenStations: organization.settings?.kitchenStations?.length ? organization.settings.kitchenStations : ["Kitchen"],
      };
      organization.receipt = { header: parsed.receiptHeader || undefined, footer: parsed.receiptFooter || undefined, prefix: parsed.receiptPrefix || undefined };
      organization.businessRegistration = { legalName: parsed.legalName || undefined, registrationNumber: parsed.registrationNumber || undefined, taxNumber: parsed.taxNumber || undefined };
      organization.subscription ??= { plan: "TRIAL", status: "TRIAL", enabledModules: [] };
      organization.onboarding = { status: "COMPLETED", completedAt: new Date(), skippedSteps: [] };

      let branch = await BranchModel.findOne({ organizationId: organization._id, code: parsed.branchCode });
      const openingHours = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: parsed.opensAt, closesAt: parsed.closesAt }));
      if (branch) {
        branch.name = parsed.branchName; branch.address = parsed.branchAddress || undefined; branch.phone = parsed.branchPhone || undefined;
        branch.city = parsed.city || undefined; branch.country = parsed.country || undefined; branch.timezone = parsed.timezone; branch.openingHours = openingHours; branch.serviceTypes = parsed.serviceTypes;
        await branch.save();
      } else {
        branch = await BranchModel.create({ organizationId: organization._id, name: parsed.branchName, code: parsed.branchCode, address: parsed.branchAddress || undefined, phone: parsed.branchPhone || undefined, city: parsed.city || undefined, country: parsed.country || undefined, timezone: parsed.timezone, openingHours, serviceTypes: parsed.serviceTypes, isActive: true, createdBy: ctx.userId });
      }

      if (parsed.tableCount > 0) {
        await Promise.all(Array.from({ length: parsed.tableCount }, (_, index) => {
          const label = `T${String(index + 1).padStart(2, "0")}`;
          return TableModel.updateOne({ organizationId: organization._id, branchId: branch!._id, label }, { $setOnInsert: { organizationId: organization._id, branchId: branch!._id, label, seats: 4, status: "AVAILABLE" } }, { upsert: true });
        }));
      }

      await Promise.all(defaultCategories.map((name, sortOrder) => CategoryModel.updateOne({ organizationId: organization._id, name }, { $setOnInsert: { organizationId: organization._id, name, sortOrder, isActive: true } }, { upsert: true })));
      await setSessionCookie({ userId: ctx.userId, organizationId: ctx.organizationId, activeBranchId: String(branch._id) });
    } else {
      organization.onboarding = { status: "PAUSED", completedAt: undefined, skippedSteps: ["restaurant profile", "branch setup", "operating configuration"] };
    }

    organization.updatedBy = ctx.userId as unknown as typeof organization.updatedBy;
    await organization.save();
    revalidatePath("/workspace");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true, data: { redirectTo: "/workspace" } };
  } catch (error) {
    return { ok: false, error: toClientError(error) };
  }
}

export async function completeOnboardingAction(formData: FormData) {
  const result = await saveOnboarding(formData, true);
  if (result.ok) redirect(result.data.redirectTo);
  redirect(`/onboarding?error=${encodeURIComponent(result.error.message)}`);
}

export async function completeOnboardingLaterAction(formData: FormData) {
  const result = await saveOnboarding(formData, false);
  if (result.ok) redirect(result.data.redirectTo);
  redirect(`/onboarding?error=${encodeURIComponent(result.error.message)}`);
}
