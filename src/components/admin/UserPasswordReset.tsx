"use client";

import { type FormEvent, useState, useTransition } from "react";
import { updateUserAction } from "@/actions/user.actions";
import { PasswordField } from "@/components/ui/PasswordField";

type UserPasswordResetProps = {
  userId: string;
  userName: string;
};

export function UserPasswordReset({ userId, userName }: UserPasswordResetProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    setFeedback(null);

    startTransition(async () => {
      const result = await updateUserAction({ userId, password });
      if (!result.ok) {
        setFeedback({ tone: "error", message: result.error.message });
        return;
      }

      form.reset();
      setFeedback({ tone: "success", message: `Password updated for ${userName}.` });
    });
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-lg border border-ink-line/15 bg-paper-dim p-3 dark:border-ink-line dark:bg-ink">
      <PasswordField id={`password-${userId}`} label="New login password" name="password" minLength={8} autoComplete="new-password" />
      <p className="mt-2 text-xs text-ink/50 dark:text-paper/55">This replaces the current password immediately. Existing passwords are never displayed.</p>
      {feedback ? <p role="status" className={`mt-2 text-xs ${feedback.tone === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{feedback.message}</p> : null}
      <button type="submit" disabled={isPending} className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{isPending ? "Saving…" : "Set password"}</button>
    </form>
  );
}
