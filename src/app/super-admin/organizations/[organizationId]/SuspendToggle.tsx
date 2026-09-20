"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrganizationActiveAction } from "@/actions/platform.actions";

export function SuspendToggle({ organizationId, isActive }: { organizationId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      await setOrganizationActiveAction(organizationId, !isActive);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`text-sm px-3 py-1.5 rounded font-medium disabled:opacity-40 ${
        isActive ? "bg-status-cancelled text-white" : "bg-status-ready text-white"
      }`}
    >
      {isActive ? "Suspend organization" : "Reactivate organization"}
    </button>
  );
}
