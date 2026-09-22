import { inviteUserAction } from "@/actions/user.actions";
import { UserPasswordReset } from "@/components/admin/UserPasswordReset";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeading } from "@/components/ui/PageHeading";
import { PasswordField } from "@/components/ui/PasswordField";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { BranchService } from "@/services/branch.service";
import { UserService } from "@/services/user.service";

export default async function AdminUsersPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  const [users, roles, branches] = await Promise.all([
    UserService.list(ctx),
    UserService.listRoles(ctx),
    BranchService.list(ctx),
  ]);

  async function handleInvite(formData: FormData) {
    "use server";
    await inviteUserAction(formData);
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeading
        eyebrow="Restaurant administration"
        title="Users and access"
        description="Create a unique staff login, set its password, then assign the role and branches it can use."
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-5">
        <Card className="overflow-hidden xl:col-span-3">
          <div className="border-b border-ink-line/15 p-5 dark:border-ink-line">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Team access</p>
            <h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Your users</h2>
            <p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Each person has an individual account — passwords are never shared between the cashier, kitchen, and manager workspaces.</p>
          </div>

          {users.length === 0 ? (
            <div className="p-5"><EmptyState icon="◎" title="No users yet" description="Create a staff account to give someone access to the right restaurant tools." /></div>
          ) : (
            <div className="divide-y divide-ink-line/10 dark:divide-ink-line">
              {users.map((user) => {
                const roleName = (user.roleId as unknown as { name?: string } | null)?.name ?? "No role";
                return (
                  <div key={String(user._id)} className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{user.name.slice(0, 2).toUpperCase()}</span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm text-ink dark:text-paper">{user.name}</b>
                        <small className="mt-1 block truncate text-xs text-ink/50 dark:text-paper/55">{user.email}</small>
                      </span>
                      <span className="text-right">
                        <small className="block text-xs text-ink/55 dark:text-paper/60">{roleName}</small>
                        <Badge tone={user.isActive ? "success" : "neutral"} className="mt-1">{user.isActive ? "Active" : "Deactivated"}</Badge>
                      </span>
                    </div>
                    <details className="mt-3">
                      <summary className="w-fit cursor-pointer text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">Set or reset password</summary>
                      <UserPasswordReset userId={String(user._id)} userName={user.name} />
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Team member</p>
          <h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Create staff login</h2>
          <p className="mt-1 text-sm text-ink/55 dark:text-paper/60">The role determines which portal the person can open after they sign in.</p>
          <form action={handleInvite} className="mt-5 space-y-3">
            <Input name="name" required placeholder="Full name" aria-label="Full name" />
            <Input name="email" type="email" required placeholder="Email address" aria-label="Email address" />
            <select name="roleId" required className="w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink-soft dark:text-paper">
              <option value="">Select a role…</option>
              {roles.map((role) => <option key={String(role._id)} value={String(role._id)}>{role.name}</option>)}
            </select>
            <fieldset className="rounded-lg border border-ink-line/15 p-3 dark:border-ink-line">
              <legend className="px-1 text-xs text-ink/55 dark:text-paper/60">Branch access</legend>
              <p className="mb-3 text-xs text-ink/45 dark:text-paper/50">Required for cashier, kitchen, and manager roles. Owners and Restaurant Admins can work across the organization.</p>
              <div className="space-y-2">
                {branches.map((branch) => <label key={String(branch._id)} className="flex items-center gap-2 text-sm text-ink/70 dark:text-paper/75"><input type="checkbox" name="assignedBranchIds" value={String(branch._id)} className="h-4 w-4 accent-indigo-600" />{branch.name}</label>)}
                {branches.length === 0 ? <p className="text-sm text-ink/50 dark:text-paper/55">Add a branch first.</p> : null}
              </div>
            </fieldset>
            <PasswordField id="invite-password" name="temporaryPassword" label="Staff login password" minLength={8} autoComplete="new-password" />
            <Button type="submit" className="w-full">Create staff login</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
