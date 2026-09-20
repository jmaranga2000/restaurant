import { redirect } from "next/navigation";
import Link from "next/link";
import { registerOrganizationAction } from "@/actions/auth.actions";
import { AuthSubmitButton } from "@/components/ui/AuthSubmitButton";
import { PasswordField } from "@/components/ui/PasswordField";

export default function RegisterPage({ searchParams }: { searchParams?: { error?: string } }) {
  async function handleRegister(formData: FormData) {
    "use server";
    const result = await registerOrganizationAction(formData);
    if (result.ok) redirect(result.data.redirectTo);
    redirect(`/register?error=${encodeURIComponent(result.error.message)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-2xl">Set up your restaurant</h1>
        <p className="mb-8 text-sm text-ink/60 dark:text-paper/60">Creates your organization and its first owner account.</p>
        {searchParams?.error ? <p role="alert" className="mb-4 rounded border border-status-cancelled/50 bg-status-cancelled/10 px-3 py-2 text-sm">{searchParams.error}</p> : null}
        <form action={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="organizationName" className="mb-1 block text-sm text-ink/80 dark:text-paper/80">
              Restaurant / group name
            </label>
            <input
              id="organizationName"
              name="organizationName"
              required
              className="w-full rounded border border-ink-line bg-white px-3 py-2 text-ink focus-visible:outline-none dark:bg-ink-soft dark:text-paper"
            />
          </div>
          <div>
            <label htmlFor="ownerName" className="mb-1 block text-sm text-ink/80 dark:text-paper/80">
              Your name
            </label>
            <input
              id="ownerName"
              name="ownerName"
              required
              className="w-full rounded border border-ink-line bg-white px-3 py-2 text-ink focus-visible:outline-none dark:bg-ink-soft dark:text-paper"
            />
          </div>
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
          <PasswordField minLength={8} autoComplete="new-password" />
          <AuthSubmitButton pendingLabel="Creating your organization…">Create organization</AuthSubmitButton>
        </form>
        <p className="mt-6 text-sm text-ink/50 dark:text-paper/40">
          Already have an account?{" "}
          <Link href="/login" className="text-ink/75 underline dark:text-paper/70">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
