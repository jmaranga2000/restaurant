import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { UserService } from "@/services/user.service";
import { BranchService } from "@/services/branch.service";
import { inviteUserAction } from "@/actions/user.actions";

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
    <div className="p-8 max-w-3xl">
      <h1 className="font-display text-2xl mb-6">Users & roles</h1>

      <ul className="divide-y divide-ink-line/10 mb-8">
        {users.map((u) => (
          <li key={String(u._id)} className="py-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-ink/40 text-xs">{u.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm">{(u.roleId as unknown as { name?: string })?.name ?? "—"}</p>
              <p className={`text-xs ${u.isActive ? "text-status-ready" : "text-ink/40"}`}>
                {u.isActive ? "Active" : "Deactivated"}
              </p>
            </div>
          </li>
        ))}
        {users.length === 0 && <li className="py-3 text-ink/40 text-sm">No users yet.</li>}
      </ul>

      <div className="border border-ink-line/20 rounded-lg p-5 bg-white">
        <h2 className="font-medium mb-4">Invite a user</h2>
        <form action={handleInvite} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="name" required placeholder="Full name" className="border border-ink-line/30 rounded px-3 py-2 text-sm" />
            <input name="email" type="email" required placeholder="Email" className="border border-ink-line/30 rounded px-3 py-2 text-sm" />
          </div>
          <select name="roleId" required className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm">
            <option value="">Select a role…</option>
            {roles.map((r) => (
              <option key={String(r._id)} value={String(r._id)}>
                {r.name}
              </option>
            ))}
          </select>
          <fieldset className="border border-ink-line/20 rounded p-3">
            <legend className="text-xs text-ink/50 px-1">
              Branch access (leave all unchecked for org-wide access)
            </legend>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {branches.map((b) => (
                <label key={String(b._id)} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="assignedBranchIds" value={String(b._id)} />
                  {b.name}
                </label>
              ))}
              {branches.length === 0 && <p className="text-ink/40 text-sm">Add a branch first.</p>}
            </div>
          </fieldset>
          <input
            name="temporaryPassword"
            type="text"
            required
            minLength={8}
            placeholder="Temporary password (share with the new user directly)"
            className="w-full border border-ink-line/30 rounded px-3 py-2 text-sm"
          />
          <button type="submit" className="w-full bg-ember hover:bg-ember-dark text-white rounded py-2 text-sm font-medium">
            Send invite
          </button>
        </form>
      </div>
    </div>
  );
}
