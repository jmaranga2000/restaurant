"use client";

import { type FormEvent, useState, useTransition } from "react";
import { unlockRoleWorkspaceAction } from "@/actions/auth.actions";
import { PasswordField } from "@/components/ui/PasswordField";

export type RoleWorkspaceCard = {
  slug: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  staffCount: number;
};

export function RoleWorkspaceChooser({ organizationName, roles }: { organizationName: string; roles: RoleWorkspaceCard[] }) {
  const [selectedRole, setSelectedRole] = useState<RoleWorkspaceCard | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function closeDialog() {
    if (!isPending) {
      setSelectedRole(null);
      setError(null);
    }
  }

  function unlockRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRole) return;
    const data = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await unlockRoleWorkspaceAction({
        roleSlug: selectedRole.slug,
        email: data.get("email"),
        password: data.get("password"),
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      window.location.assign(result.data.redirectTo);
    });
  }

  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Restaurant roles">
        {roles.map((role) => {
          const available = role.staffCount > 0;
          return (
            <button key={role.slug} type="button" disabled={!available} onClick={() => { setSelectedRole(role); setError(null); }} className="group min-h-60 rounded-xl border border-ink-line/15 bg-white p-5 text-left shadow-[0_12px_32px_rgba(8,44,70,0.05)] transition hover:-translate-y-0.5 hover:border-indigo-400/60 hover:shadow-[0_16px_36px_rgba(8,44,70,0.12)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55 dark:border-ink-line dark:bg-ink-soft dark:hover:border-indigo-300/60">
              <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${role.accent}`} aria-hidden="true">{role.icon}</span>
              <h2 className="mt-5 font-display text-xl text-ink dark:text-paper">{role.label}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-ink/60 dark:text-paper/65">{role.description}</p>
              <span className={`mt-5 inline-flex text-sm font-semibold ${available ? "text-indigo-700 dark:text-indigo-300" : "text-ink/45 dark:text-paper/45"}`}>{available ? `${role.staffCount} account${role.staffCount === 1 ? "" : "s"} · Unlock →` : "No active account configured"}</span>
            </button>
          );
        })}
      </section>

      {selectedRole ? <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="role-unlock-title"><button type="button" aria-label="Close role unlock" onClick={closeDialog} className="absolute inset-0 cursor-default bg-ink/60 backdrop-blur-sm" /><section className="relative z-10 w-full max-w-md rounded-2xl border border-ink-line/15 bg-white p-6 shadow-2xl dark:border-ink-line dark:bg-ink-soft"><button type="button" onClick={closeDialog} disabled={isPending} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-paper-dim hover:text-ink disabled:opacity-50 dark:text-paper/55 dark:hover:bg-paper/10 dark:hover:text-paper" aria-label="Close">×</button><span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${selectedRole.accent}`} aria-hidden="true">{selectedRole.icon}</span><p className="mt-4 text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">{organizationName}</p><h2 id="role-unlock-title" className="mt-1 font-display text-2xl text-ink dark:text-paper">Unlock {selectedRole.label}</h2><p className="mt-2 text-sm leading-6 text-ink/60 dark:text-paper/65">Enter the work email and password assigned to you by the Restaurant Admin. This opens only your permitted workspace.</p><form onSubmit={unlockRole} className="mt-5 space-y-4"><div><label htmlFor="role-email" className="mb-1 block text-sm text-ink/80 dark:text-paper/80">Work email</label><input id="role-email" name="email" type="email" required autoComplete="username" className="w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink dark:text-paper dark:placeholder:text-paper/35" placeholder="you@restaurant.com" /></div><PasswordField id="role-password" name="password" label="Password" minLength={8} autoComplete="current-password" />{error ? <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">{error}</p> : null}<button type="submit" disabled={isPending} className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{isPending ? "Unlocking…" : `Unlock ${selectedRole.label}`}</button></form></section></div> : null}
    </>
  );
}
