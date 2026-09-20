import { redirect } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/actions/auth.actions";
import { AuthSubmitButton } from "@/components/ui/AuthSubmitButton";
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
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-2xl">Restaurant OS</h1>
        <p className="mb-8 text-sm text-ink/60 dark:text-paper/60">Sign in to your organization</p>
        {searchParams?.error ? <p role="alert" className="mb-4 rounded border border-status-cancelled/50 bg-status-cancelled/10 px-3 py-2 text-sm">{searchParams.error}</p> : null}
        <form action={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-ink/80 dark:text-paper/80">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded border border-ink-line bg-white px-3 py-2 text-ink focus-visible:outline-none dark:bg-ink-soft dark:text-paper"
            />
          </div>
          <PasswordField />
          <AuthSubmitButton pendingLabel="Signing in…">Sign in</AuthSubmitButton>
        </form>
        <p className="mt-6 text-sm text-ink/50 dark:text-paper/40">
          New restaurant?{" "}
          <Link href="/register" className="text-ink/75 underline dark:text-paper/70">
            Set up your organization
          </Link>
        </p>
      </div>
    </main>
  );
}
