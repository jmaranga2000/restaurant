"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchActiveBranchAction } from "@/actions/branch.actions";

interface BranchOption {
  id: string;
  name: string;
}

export function BranchSwitcher({ branches, activeBranchId, allowAll = false }: { branches: BranchOption[]; activeBranchId: string | null; allowAll?: boolean }) {
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
      value={activeBranchId ?? (allowAll ? "__all__" : "")}
      disabled={isPending}
      onChange={(e) => onChange(e.target.value)}
      className="bg-ink-soft border border-ink-line rounded px-2 py-1 text-sm text-paper"
    >
      {allowAll ? <option value="__all__">All branches</option> : null}
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
