"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createMenuCategoryAction } from "@/actions/menu.actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null);
    const result = await createMenuCategoryAction(name);
    setBusy(false);
    if (!result.ok) return setError(result.error.message);
    router.push("/admin/menu/categories");
    router.refresh();
  }

  return <Card className="mt-6 max-w-xl p-5"><form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium">Category name<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Breakfast" required minLength={2} maxLength={80} className="mt-2" /></label>{error ? <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100">{error}</p> : null}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create category"}</Button></div></form></Card>;
}