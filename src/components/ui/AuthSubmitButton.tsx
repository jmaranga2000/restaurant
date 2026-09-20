"use client";

import { useFormStatus } from "react-dom";

export function AuthSubmitButton({
  children,
  pendingLabel,
  tone = "ember",
}: {
  children: string;
  pendingLabel: string;
  tone?: "ember" | "danger";
}) {
  const { pending } = useFormStatus();
  const colors = tone === "danger" ? "bg-status-cancelled hover:bg-status-cancelled/85" : "bg-ember hover:bg-ember-dark";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`flex w-full items-center justify-center gap-2 rounded py-2 font-medium text-white transition-colors disabled:cursor-wait disabled:opacity-75 ${colors}`}
    >
      {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
