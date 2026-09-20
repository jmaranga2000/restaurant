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
    name: organization.name, description: organization.description, phone: organization.phone, email: organization.email, address: organization.address, city: organization.city, country: organization.country,
    currency: organization.defaultCurrency, timezone: organization.defaultTimezone, logoUrl: organization.logoUrl, taxRatePercent: organization.settings?.taxRatePercent, serviceChargePercent: organization.settings?.serviceChargePercent,
    taxLabel: organization.settings?.taxLabel, pricesIncludeTax: organization.settings?.pricesIncludeTax, receiptHeader: organization.receipt?.header, receiptFooter: organization.receipt?.footer, receiptPrefix: organization.receipt?.prefix,
    legalName: organization.businessRegistration?.legalName, registrationNumber: organization.businessRegistration?.registrationNumber, taxNumber: organization.businessRegistration?.taxNumber,
    serviceTypes: organization.settings?.serviceTypes, paymentMethods: organization.settings?.paymentMethods?.filter((method) => method.enabled).map((method) => method.code), branchName: branch?.name, branchCode: branch?.code,
    branchAddress: branch?.address, branchPhone: branch?.phone, opensAt: branch?.openingHours?.[0]?.opensAt, closesAt: branch?.openingHours?.[0]?.closesAt,
  }} />;
}
