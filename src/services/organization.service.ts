import "server-only";
import { connectToDatabase } from "@/lib/db";
import { OrganizationModel } from "@/models/Organization";
import { AuditService } from "@/services/audit.service";
import { requirePermissions, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { NotFoundError } from "@/lib/errors";
import type { UpdateOrganizationSettingsInput } from "@/validations/organization.schema";

export const OrganizationService = {
  async getForAdmin(ctx: AuthContext) {
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
    await connectToDatabase();
    const org = await OrganizationModel.findById(ctx.organizationId).lean();
    if (!org) throw new NotFoundError("Organization");
    return org;
  },

  async updateSettings(ctx: AuthContext, input: UpdateOrganizationSettingsInput) {
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
    await connectToDatabase();

    const org = await OrganizationModel.findById(ctx.organizationId);
    if (!org) throw new NotFoundError("Organization");

    const before = {
      name: org.name,
      defaultCurrency: org.defaultCurrency,
      defaultTimezone: org.defaultTimezone,
      settings: { ...org.settings },
    };

    if (input.name !== undefined) org.name = input.name;
    if (input.defaultCurrency !== undefined) org.defaultCurrency = input.defaultCurrency;
    if (input.defaultTimezone !== undefined) org.defaultTimezone = input.defaultTimezone;
    org.settings ??= { taxRatePercent: 0, serviceChargePercent: 0 };
    if (input.taxRatePercent !== undefined) org.settings.taxRatePercent = input.taxRatePercent;
    if (input.serviceChargePercent !== undefined) org.settings.serviceChargePercent = input.serviceChargePercent;
    org.updatedBy = ctx.userId as unknown as typeof org.updatedBy;
    await org.save();

    await AuditService.record({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      action: "organization.settings_updated",
      entityType: "Organization",
      entityId: String(org._id),
      before,
      after: {
        name: org.name,
        defaultCurrency: org.defaultCurrency,
        defaultTimezone: org.defaultTimezone,
        settings: { ...org.settings },
      },
    });

    return org;
  },
};
