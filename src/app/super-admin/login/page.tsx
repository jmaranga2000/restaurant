import { redirect } from "next/navigation";
import { platformLoginAction } from "@/actions/platform.actions";
import { PasswordField } from "@/components/ui/PasswordField";
import { AuthSubmitButton } from "@/components/ui/AuthSubmitButton";

export default function SuperAdminLoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  async function handleLogin(formData: FormData) {
    "use server";
    const result = await platformLoginAction(formData);
    if (result.ok) redirect(result.data.redirectTo);
    redirect(`/super-admin/login?error=${encodeURIComponent(result.error.message)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      <div className="w-full max-w-sm">
        <p className="text-status-cancelled text-xs uppercase tracking-wide mb-1">Platform staff only</p>
        <h1 className="mb-8 font-display text-2xl">Super Admin</h1>
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
          <AuthSubmitButton tone="danger" pendingLabel="Signing in…">Sign in</AuthSubmitButton>
        </form>
      </div>
    </main>
  );
}
