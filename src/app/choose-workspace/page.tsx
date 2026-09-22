import { RoleWorkspaceChooser, type RoleWorkspaceCard } from "@/components/access/RoleWorkspaceChooser";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { getOrganizationAccess } from "@/lib/session";
import { OrganizationModel } from "@/models/Organization";
import { RoleModel } from "@/models/Role";
import { UserModel } from "@/models/User";
import { redirect } from "next/navigation";

const rolePresentation: Record<string, Omit<RoleWorkspaceCard, "slug" | "staffCount">> = {
  owner: {
    label: "Restaurant owner",
    description: "Restaurant administration, organization controls, and complete operational visibility.",
    icon: "✦",
    accent: "bg-violet-500/10 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
  },
  restaurant_admin: {
    label: "Restaurant admin",
    description: "Menu, users, settings, payment methods, displays, and restaurant configuration.",
    icon: "⚙",
    accent: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200",
  },
  branch_manager: {
    label: "Manager workspace",
    description: "Branch performance, orders, stock, staff, and daily restaurant operations.",
    icon: "◫",
    accent: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
  },
  cashier: {
    label: "Cashier portal",
    description: "Register, orders, payments, tables, customers, and loyalty rewards.",
    icon: "▣",
    accent: "bg-amber-500/10 text-amber-800 dark:bg-amber-400/15 dark:text-amber-100",
  },
  waiter: {
    label: "Service portal",
    description: "Create and manage assigned service orders without payment collection access.",
    icon: "◌",
    accent: "bg-orange-500/10 text-orange-800 dark:bg-orange-400/15 dark:text-orange-100",
  },
  kitchen_staff: {
    label: "Kitchen display",
    description: "Station tickets and the new, preparing, ready, and completed kitchen workflow.",
    icon: "◉",
    accent: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
  },
};

const roleOrder = ["owner", "restaurant_admin", "branch_manager", "cashier", "waiter", "kitchen_staff"];

export default async function ChooseWorkspacePage() {
  const access = await getOrganizationAccess();
  if (!access) redirect("/login");
  const [organization, roles, activeUsers] = await Promise.all([
    OrganizationModel.findOne({ _id: access.organizationId, isActive: true }).select("name").lean(),
    RoleModel.find({ organizationId: access.organizationId }).select("slug").lean(),
    UserModel.find({ organizationId: access.organizationId, isActive: true }).select("roleId").lean(),
  ]);
  const activeUsersByRole = new Map<string, number>();
  for (const user of activeUsers) {
    const roleId = String(user.roleId);
    activeUsersByRole.set(roleId, (activeUsersByRole.get(roleId) ?? 0) + 1);
  }
  const roleCards = roles.flatMap((role) => {
    const presentation = rolePresentation[role.slug];
    if (!presentation) return [];
    return [{ slug: role.slug, staffCount: activeUsersByRole.get(String(role._id)) ?? 0, ...presentation }];
  }).sort((left, right) => roleOrder.indexOf(left.slug) - roleOrder.indexOf(right.slug));

  return (
    <main className="min-h-screen bg-paper px-4 py-8 text-ink transition-colors dark:bg-ink dark:text-paper sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <PageHeading eyebrow="Restaurant access" title="Choose your role" description="The restaurant is open. Select your role, then unlock it with the work email and password assigned to you." />
        {roleCards.length ? <RoleWorkspaceChooser organizationName={organization?.name ?? "Your restaurant"} roles={roleCards} /> : <div className="mt-8"><EmptyState icon="⌂" title="No roles are available" description="The restaurant owner can complete setup and create staff accounts from Restaurant Admin." /></div>}
      </div>
    </main>
  );
}
