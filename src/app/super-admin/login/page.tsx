import { redirect } from "next/navigation";
import { platformLoginAction } from "@/actions/platform.actions";

export default function SuperAdminLoginPage() {
  async function handleLogin(formData: FormData) {
    "use server";
    const result = await platformLoginAction(formData);
    if (result.ok) redirect(result.data.redirectTo);
    redirect(`/super-admin/login?error=${encodeURIComponent(result.error.message)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <p className="text-status-cancelled text-xs uppercase tracking-wide mb-1">Platform staff only</p>
        <h1 className="font-display text-2xl text-paper mb-8">Super Admin</h1>
        <form action={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-paper/80 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded bg-ink-soft border border-ink-line px-3 py-2 text-paper focus-visible:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-paper/80 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded bg-ink-soft border border-ink-line px-3 py-2 text-paper focus-visible:outline-none"
            />
          </div>
          <button type="submit" className="w-full rounded bg-status-cancelled text-white py-2 font-medium">
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
