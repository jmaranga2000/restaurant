import { inviteUserAction } from "@/actions/user.actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { BranchService } from "@/services/branch.service";
import { UserService } from "@/services/user.service";

export default async function AdminUsersPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  const [users, roles, branches] = await Promise.all([UserService.list(ctx), UserService.listRoles(ctx), BranchService.list(ctx)]);

  async function handleInvite(formData: FormData) {
    "use server";
    await inviteUserAction(formData);
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeading eyebrow="Restaurant administration" title="Users and roles" description="Control who can access each location and what they can do." />
      <div className="mt-6 grid gap-4 xl:grid-cols-5">
        <Card className="overflow-hidden xl:col-span-3"><div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Team access</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Your users</h2></div>{users.length === 0 ? <div className="p-5"><EmptyState icon="◎" title="No users yet" description="Invite a teammate to give them access to the right restaurant tools." /></div> : <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{users.map((user) => <div key={String(user._id)} className="flex items-center gap-4 px-5 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{user.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{user.name}</b><small className="mt-1 block truncate text-xs text-ink/50 dark:text-paper/55">{user.email}</small></span><span className="hidden text-right sm:block"><small className="block text-xs text-ink/55 dark:text-paper/60">{(user.roleId as unknown as { name?: string })?.name ?? "No role"}</small><Badge tone={user.isActive ? "success" : "neutral"} className="mt-1">{user.isActive ? "Active" : "Deactivated"}</Badge></span></div>)}</div>}</Card>
        <Card className="p-5 xl:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Team member</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Invite a user</h2><form action={handleInvite} className="mt-5 space-y-3"><Input name="name" required placeholder="Full name" /><Input name="email" type="email" required placeholder="Email address" /><select name="roleId" required className="w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink-soft dark:text-paper"><option value="">Select a role…</option>{roles.map((role) => <option key={String(role._id)} value={String(role._id)}>{role.name}</option>)}</select><fieldset className="rounded-lg border border-ink-line/15 p-3 dark:border-ink-line"><legend className="px-1 text-xs text-ink/55 dark:text-paper/60">Branch access</legend><p className="mb-3 text-xs text-ink/45 dark:text-paper/50">Leave unselected for organization-wide access.</p><div className="space-y-2">{branches.map((branch) => <label key={String(branch._id)} className="flex items-center gap-2 text-sm text-ink/70 dark:text-paper/75"><input type="checkbox" name="assignedBranchIds" value={String(branch._id)} className="h-4 w-4 accent-indigo-600" />{branch.name}</label>)}{branches.length === 0 ? <p className="text-sm text-ink/50 dark:text-paper/55">Add a branch first.</p> : null}</div></fieldset><Input name="temporaryPassword" required minLength={8} type="text" placeholder="Temporary password" /><Button type="submit" className="w-full">Send invite</Button></form></Card>
      </div>
    </div>
  );
}
