import { redirect } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/actions/auth.actions";
import { PasswordField } from "@/components/ui/PasswordField";

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
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
        {searchParams?.error ? <p role="alert" className="mb-4 rounded border border-status-cancelled/50 bg-status-cancelled/10 px-3 py-2 text-sm text-paper">{searchParams.error}</p> : null}
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
          <PasswordField />
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
