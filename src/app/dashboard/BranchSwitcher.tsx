"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchActiveBranchAction } from "@/actions/branch.actions";

interface BranchOption {
  id: string;
  name: string;
}

export function BranchSwitcher({ branches, activeBranchId }: { branches: BranchOption[]; activeBranchId: string | null }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onChange(branchId: string) {
    startTransition(async () => {
      await switchActiveBranchAction(branchId);
      router.refresh();
    });
  }

  return (
    <select
      value={activeBranchId ?? ""}
      disabled={isPending}
      onChange={(e) => onChange(e.target.value)}
      className="bg-ink-soft border border-ink-line rounded px-2 py-1 text-sm text-paper"
    >
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
