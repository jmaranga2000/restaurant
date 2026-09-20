import { redirect } from "next/navigation";
import Link from "next/link";
import { registerOrganizationAction } from "@/actions/auth.actions";

export default function RegisterPage() {
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
          <div>
            <label htmlFor="password" className="block text-sm text-paper/80 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded bg-ink-soft border border-ink-line px-3 py-2 text-paper focus-visible:outline-none"
            />
          </div>
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
