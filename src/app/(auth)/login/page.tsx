import { redirect } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/actions/auth.actions";

export default function LoginPage() {
  async function handleLogin(formData: FormData) {
    "use server";
    const result = await loginAction(formData);
    if (result.ok) redirect(result.data.redirectTo);
    // A real page would surface result.error.message via a client-side
    // wrapper (useFormState) — kept server-only here to stay a minimal slice.
    redirect(`/login?error=${encodeURIComponent(result.error.message)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-paper mb-1">Restaurant OS</h1>
        <p className="text-paper/60 text-sm mb-8">Sign in to your organization</p>
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
          <button
            type="submit"
            className="w-full rounded bg-ember hover:bg-ember-dark transition-colors text-white py-2 font-medium"
          >
            Sign in
          </button>
        </form>
        <p className="text-paper/40 text-sm mt-6">
          New restaurant?{" "}
          <Link href="/register" className="text-paper/70 underline">
            Set up your organization
          </Link>
        </p>
      </div>
    </main>
  );
}
