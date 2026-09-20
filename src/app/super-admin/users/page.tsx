import { requirePlatformSession } from "@/lib/platform-session";
import { PlatformService } from "@/services/platform.service";

export default async function SuperAdminUsersPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  await requirePlatformSession();
  const allUsers = await PlatformService.listUsers();
  const query = searchParams.q?.trim().toLowerCase() ?? "";
  const users = allUsers.filter((user) => {
    const matchesQuery = !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.organizationName.toLowerCase().includes(query);
    const matchesStatus = !searchParams.status || searchParams.status === "all" || (searchParams.status === "active" ? user.isActive : !user.isActive);
    return matchesQuery && matchesStatus;
  });

  return <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-indigo-500">Platform directory</p><h1 className="mt-3 font-display text-3xl">Users</h1><p className="mt-2 text-sm text-ink/50">Global users, roles, and access across every organization.</p></div><button className="bg-ink px-4 py-2 text-sm text-white">Add user</button></div>
    <form className="mb-5 flex flex-col gap-3 border border-ink-line/15 bg-white p-4 sm:flex-row"><input name="q" defaultValue={searchParams.q} placeholder="Search users, email, or organization..." className="min-w-0 flex-1 border border-ink-line/20 px-3 py-2 text-sm" /><select name="status" defaultValue={searchParams.status ?? "all"} className="border border-ink-line/20 bg-white px-3 py-2 text-sm"><option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select><button className="bg-ink px-5 py-2 text-sm text-white">Filter</button></form>
    <div className="overflow-x-auto border border-ink-line/15 bg-white"><table className="w-full min-w-[780px] text-sm"><thead className="border-b border-ink-line/15 bg-paper text-left text-xs uppercase tracking-wide text-ink/45"><tr><th className="px-5 py-3 font-normal">User</th><th className="px-3 py-3 font-normal">Organization</th><th className="px-3 py-3 font-normal">Role</th><th className="px-3 py-3 font-normal">Status</th><th className="px-3 py-3 font-normal">Last login</th><th className="px-5 py-3 font-normal">Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-ink-line/10 hover:bg-paper/70"><td className="px-5 py-4"><p className="font-medium">{user.name}</p><p className="mt-1 text-xs text-ink/40">{user.email}</p></td><td className="px-3 py-4">{user.organizationName}</td><td className="px-3 py-4"><span className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-600">{user.role}</span></td><td className="px-3 py-4"><span className={user.isActive ? "text-status-ready" : "text-status-cancelled"}>● {user.isActive ? "Active" : "Suspended"}</span></td><td className="px-3 py-4 text-xs text-ink/50">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-GB") : "Never"}</td><td className="px-5 py-4 text-xs text-indigo-500">View activity →</td></tr>)}{users.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-ink/40">No users match the current filters.</td></tr>}</tbody></table></div>
  </div>;
}
