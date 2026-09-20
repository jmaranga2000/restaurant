import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { BranchService } from "@/services/branch.service";
import { createBranchAction } from "@/actions/branch.actions";

export default async function AdminBranchesPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  const branches = await BranchService.list(ctx);

  async function handleCreate(formData: FormData) {
    "use server";
    await createBranchAction(formData);
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-display text-2xl mb-6">Branches</h1>

      <ul className="divide-y divide-ink-line/10 mb-8">
        {branches.map((b) => (
          <li key={String(b._id)} className="py-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-ink/40 text-xs">
                {b.code}
                {b.address ? ` · ${b.address}` : ""}
              </p>
            </div>
            <span className={b.isActive ? "text-status-ready text-xs" : "text-ink/40 text-xs"}>
              {b.isActive ? "Active" : "Inactive"}
            </span>
          </li>
        ))}
        {branches.length === 0 && <li className="py-3 text-ink/40 text-sm">No branches yet.</li>}
      </ul>

      <div className="border border-ink-line/20 rounded-lg p-5 bg-white">
        <h2 className="font-medium mb-4">Add a branch</h2>
        <form action={handleCreate} className="grid grid-cols-2 gap-3">
          <input name="name" required placeholder="Branch name" className="border border-ink-line/30 rounded px-3 py-2 text-sm" />
          <input name="code" required placeholder="Code (e.g. NBO-01)" className="border border-ink-line/30 rounded px-3 py-2 text-sm" />
          <input name="address" placeholder="Address (optional)" className="col-span-2 border border-ink-line/30 rounded px-3 py-2 text-sm" />
          <button type="submit" className="col-span-2 bg-ember hover:bg-ember-dark text-white rounded py-2 text-sm font-medium">
            Add branch
          </button>
        </form>
      </div>
    </div>
  );
}
