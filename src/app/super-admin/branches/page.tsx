import { requirePlatformSession } from "@/lib/platform-session";
import { PlatformService } from "@/services/platform.service";

export default async function SuperAdminBranchesPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  await requirePlatformSession();
  const allBranches = await PlatformService.listBranches();
  const query = searchParams.q?.trim().toLowerCase() ?? "";
  const branches = allBranches.filter((branch) => {
    const matchesQuery = !query || branch.name.toLowerCase().includes(query) || branch.code.toLowerCase().includes(query) || branch.organizationName.toLowerCase().includes(query);
    const matchesStatus = !searchParams.status || searchParams.status === "all" || (searchParams.status === "active" ? branch.isActive : !branch.isActive);
    return matchesQuery && matchesStatus;
  });

  return <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-indigo-500">Platform directory</p><h1 className="mt-3 font-display text-3xl">Branches</h1><p className="mt-2 text-sm text-ink/50">Manage every operating location across the platform.</p></div><button className="bg-ink px-4 py-2 text-sm text-white">Add branch</button></div>
    <form className="mb-5 flex flex-col gap-3 border border-ink-line/15 bg-white p-4 sm:flex-row"><input name="q" defaultValue={searchParams.q} placeholder="Search branches or organizations..." className="min-w-0 flex-1 border border-ink-line/20 px-3 py-2 text-sm" /><select name="status" defaultValue={searchParams.status ?? "all"} className="border border-ink-line/20 bg-white px-3 py-2 text-sm"><option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select><button className="bg-ink px-5 py-2 text-sm text-white">Filter</button></form>
    <div className="overflow-x-auto border border-ink-line/15 bg-white"><table className="w-full min-w-[720px] text-sm"><thead className="border-b border-ink-line/15 bg-paper text-left text-xs uppercase tracking-wide text-ink/45"><tr><th className="px-5 py-3 font-normal">Branch</th><th className="px-3 py-3 font-normal">Organization</th><th className="px-3 py-3 font-normal">Location</th><th className="px-3 py-3 font-normal">Status</th><th className="px-3 py-3 font-normal">Created</th><th className="px-5 py-3 font-normal">Action</th></tr></thead><tbody>{branches.map((branch) => <tr key={branch.id} className="border-b border-ink-line/10 hover:bg-paper/70"><td className="px-5 py-4"><p className="font-medium">{branch.name}</p><p className="mt-1 text-xs text-ink/40">{branch.code}</p></td><td className="px-3 py-4">{branch.organizationName}</td><td className="px-3 py-4 text-xs text-ink/55">{branch.address}</td><td className="px-3 py-4"><span className={branch.isActive ? "text-status-ready" : "text-status-cancelled"}>● {branch.isActive ? "Active" : "Inactive"}</span></td><td className="px-3 py-4 text-xs text-ink/50">{new Date(branch.createdAt).toLocaleDateString("en-GB")}</td><td className="px-5 py-4 text-xs text-indigo-500">Open →</td></tr>)}{branches.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-ink/40">No branches match the current filters.</td></tr>}</tbody></table></div>
  </div>;
}
