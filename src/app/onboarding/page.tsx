import { redirect } from "next/navigation";
import { OnboardingWizard } from "./OnboardingWizard";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { OrganizationModel } from "@/models/Organization";
import { BranchModel } from "@/models/Branch";
import { connectToDatabase } from "@/lib/db";

export default async function OnboardingPage({ searchParams }: { searchParams?: { error?: string; edit?: string } }) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
  await connectToDatabase();
  const [organization, branch] = await Promise.all([OrganizationModel.findById(ctx.organizationId).lean(), BranchModel.findOne({ organizationId: ctx.organizationId }).sort({ createdAt: 1 }).lean()]);
  if (!organization) redirect("/login");
  if (organization.onboarding?.status === "COMPLETED" && searchParams?.edit !== "1") redirect("/workspace");

  return <OnboardingWizard error={searchParams?.error} initial={{
    name: organization.name, description: organization.description ?? undefined, phone: organization.phone ?? undefined, email: organization.email ?? undefined, address: organization.address ?? undefined, city: organization.city ?? undefined, country: organization.country ?? undefined,
    currency: organization.defaultCurrency, timezone: organization.defaultTimezone, logoUrl: organization.logoUrl ?? undefined, taxRatePercent: organization.settings?.taxRatePercent ?? undefined, serviceChargePercent: organization.settings?.serviceChargePercent ?? undefined,
    taxLabel: organization.settings?.taxLabel ?? undefined, pricesIncludeTax: organization.settings?.pricesIncludeTax ?? undefined, receiptHeader: organization.receipt?.header ?? undefined, receiptFooter: organization.receipt?.footer ?? undefined, receiptPrefix: organization.receipt?.prefix ?? undefined,
    legalName: organization.businessRegistration?.legalName ?? undefined, registrationNumber: organization.businessRegistration?.registrationNumber ?? undefined, taxNumber: organization.businessRegistration?.taxNumber ?? undefined,
    serviceTypes: organization.settings?.serviceTypes?.flatMap((type) => type ? [type] : []), paymentMethods: organization.settings?.paymentMethods?.flatMap((method) => method.enabled && method.code ? [method.code] : []), branchName: branch?.name ?? undefined, branchCode: branch?.code ?? undefined,
    branchAddress: branch?.address ?? undefined, branchPhone: branch?.phone ?? undefined, opensAt: branch?.openingHours?.[0]?.opensAt ?? undefined, closesAt: branch?.openingHours?.[0]?.closesAt ?? undefined,
  }} />;
}
