import { UserPasswordReset } from "@/components/admin/UserPasswordReset";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { UserService } from "@/services/user.service";

export default async function AdminUsersPage() {
  const ctx = await loadAuthContext(await requireSession());
  const users = await UserService.list(ctx);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeading eyebrow="Restaurant administration" title="Users and access" description="Review staff accounts, roles, branch assignments, and login access." actions={<Button href="/admin/users/new">New staff login</Button>} />
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Team access</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Your users</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Each person has an individual account with access controlled by their role and assigned branches.</p></div>
        {users.length === 0 ? <div className="p-5"><EmptyState icon="◎" title="No users yet" description="Create a staff account to give someone access to the right restaurant tools." action={<Button href="/admin/users/new">New staff login</Button>} /></div> : <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{users.map((user) => {
          const roleName = (user.roleId as unknown as { name?: string } | null)?.name ?? "No role";
          return <div key={String(user._id)} className="px-5 py-4"><div className="flex items-center gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{user.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{user.name}</b><small className="mt-1 block truncate text-xs text-ink/50 dark:text-paper/55">{user.email}</small></span><span className="text-right"><small className="block text-xs text-ink/55 dark:text-paper/60">{roleName}</small><Badge tone={user.isActive ? "success" : "neutral"} className="mt-1">{user.isActive ? "Active" : "Deactivated"}</Badge></span></div><details className="mt-3"><summary className="w-fit cursor-pointer text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">Set or reset password</summary><UserPasswordReset userId={String(user._id)} userName={user.name} /></details></div>;
        })}</div>}
      </Card>
    </div>
  );
}
