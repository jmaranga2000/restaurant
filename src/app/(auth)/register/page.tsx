import { redirect } from "next/navigation";
import Link from "next/link";
import { registerOrganizationAction } from "@/actions/auth.actions";
import { PasswordField } from "@/components/ui/PasswordField";

export default function RegisterPage({ searchParams }: { searchParams?: { error?: string } }) {
  async function handleRegister(formData: FormData) {
    "use server";
    const result = await registerOrganizationAction(formData);
    if (result.ok) redirect(result.data.redirectTo);
    redirect(`/register?error=${encodeURIComponent(result.error.message)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-paper mb-1">Set up your restaurant</h1>
        <p className="text-paper/60 text-sm mb-8">Creates your organization and its first owner account.</p>
        {searchParams?.error ? <p role="alert" className="mb-4 rounded border border-status-cancelled/50 bg-status-cancelled/10 px-3 py-2 text-sm text-paper">{searchParams.error}</p> : null}
        <form action={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="organizationName" className="block text-sm text-paper/80 mb-1">
              Restaurant / group name
            </label>
            <input
              id="organizationName"
              name="organizationName"
              required
              className="w-full rounded bg-ink-soft border border-ink-line px-3 py-2 text-paper focus-visible:outline-none"
            />
          </div>
          <div>
            <label htmlFor="ownerName" className="block text-sm text-paper/80 mb-1">
              Your name
            </label>
            <input
              id="ownerName"
              name="ownerName"
              required
              className="w-full rounded bg-ink-soft border border-ink-line px-3 py-2 text-paper focus-visible:outline-none"
            />
          </div>
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
          <PasswordField minLength={8} autoComplete="new-password" />
          <button
            type="submit"
            className="w-full rounded bg-ember hover:bg-ember-dark transition-colors text-white py-2 font-medium"
          >
            Create organization
          </button>
        </form>
        <p className="text-paper/40 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-paper/70 underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
