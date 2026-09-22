import "server-only";
import { RoleModel } from "@/models/Role";
import { DEFAULT_ROLE_TEMPLATES } from "@/types/permissions";

/**
 * Keeps the named system-role templates exact while leaving any separately
 * created custom roles untouched. This prevents a legacy Manager role from
 * retaining Cashier or Kitchen access after the portals are separated.
 */
export async function synchronizeSystemRoles(organizationId: string): Promise<void> {
  await Promise.all(
    Object.entries(DEFAULT_ROLE_TEMPLATES).map(([slug, permissions]) => RoleModel.updateOne(
      { organizationId, slug },
      {
        $set: {
          organizationId,
          slug,
          name: slug.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
          isSystemRole: true,
          permissions,
        },
      },
      { upsert: true }
    ))
  );
}
