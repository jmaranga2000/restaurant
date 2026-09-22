import { inviteUserAction } from "@/actions/user.actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeading } from "@/components/ui/PageHeading";
import { PasswordField } from "@/components/ui/PasswordField";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { BranchService } from "@/services/branch.service";
import { UserService } from "@/services/user.service";

export default async function NewAdminUserPage() {
  const ctx = await loadAuthContext(await requireSession());
  const [roles, branches] = await Promise.all([UserService.listRoles(ctx), BranchService.list(ctx)]);

  async function handleInvite(formData: FormData) {
    "use server";
    await inviteUserAction(formData);
  }

  return <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Restaurant administration" title="New staff login" description="Create a unique staff account, then assign the role and branches it can use." /><Card className="mt-6 max-w-2xl p-5"><form action={handleInvite} className="space-y-4"><Input name="name" required placeholder="Full name" aria-label="Full name" /><Input name="email" type="email" required placeholder="Email address" aria-label="Email address" /><select name="roleId" required className="w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink-soft dark:text-paper"><option value="">Select a role…</option>{roles.map((role) => <option key={String(role._id)} value={String(role._id)}>{role.name}</option>)}</select><fieldset className="rounded-lg border border-ink-line/15 p-3 dark:border-ink-line"><legend className="px-1 text-xs text-ink/55 dark:text-paper/60">Branch access</legend><p className="mb-3 text-xs text-ink/45 dark:text-paper/50">Required for cashier, kitchen, and manager roles. Owners and Restaurant Admins can work across the organization.</p><div className="space-y-2">{branches.map((branch) => <label key={String(branch._id)} className="flex items-center gap-2 text-sm text-ink/70 dark:text-paper/75"><input type="checkbox" name="assignedBranchIds" value={String(branch._id)} className="h-4 w-4 accent-indigo-600" />{branch.name}</label>)}{branches.length === 0 ? <p className="text-sm text-ink/50 dark:text-paper/55">Add a branch first.</p> : null}</div></fieldset><PasswordField id="invite-password" name="temporaryPassword" label="Staff login password" minLength={8} autoComplete="new-password" /><div className="flex justify-end gap-2"><Button href="/admin/users" variant="ghost">Cancel</Button><Button type="submit">Create staff login</Button></div></form></Card></div>;
}
