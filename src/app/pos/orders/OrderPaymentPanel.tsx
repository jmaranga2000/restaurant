"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordPaymentAction } from "@/actions/order.actions";
import { Button } from "@/components/ui/Button";

export function OrderPaymentPanel({ orderId, balanceMinor, currency, paymentMethods }: { orderId: string; balanceMinor: number; currency: string; paymentMethods: { code: string; label: string }[] }) {
  const router = useRouter();
  const [method, setMethod] = useState(paymentMethods[0]?.code ?? "CASH");
  const [amount, setAmount] = useState(String(balanceMinor / 100));
  const [reference, setReference] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formatMoney = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    startTransition(async () => {
      const result = await recordPaymentAction({ orderId, method, amountMinor: Math.round(Number(amount) * 100), reference: reference || undefined });
      if (!result.ok) {
        setNotice(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return <form onSubmit={submit} className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-400/25 dark:bg-indigo-400/10"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-[.12em] text-indigo-700 dark:text-indigo-200">Collect payment</p><span className="text-xs font-semibold text-indigo-700 dark:text-indigo-200">{formatMoney(balanceMinor)} due</span></div><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"><select value={method} onChange={(event) => setMethod(event.target.value)} className="rounded-lg border border-ink-line/20 bg-white px-3 py-2 text-xs dark:border-ink-line dark:bg-ink-soft dark:text-paper">{paymentMethods.map((entry) => <option key={entry.code} value={entry.code}>{entry.label}</option>)}</select><input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" className="rounded-lg border border-ink-line/20 bg-white px-3 py-2 text-xs dark:border-ink-line dark:bg-ink-soft dark:text-paper" aria-label="Payment amount" /><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference" className="rounded-lg border border-ink-line/20 bg-white px-3 py-2 text-xs dark:border-ink-line dark:bg-ink-soft dark:text-paper" aria-label="Payment reference" /><Button type="submit" size="sm" disabled={isPending}>{isPending ? "Saving…" : "Mark paid"}</Button></div>{notice ? <p className="mt-2 text-xs text-red-700 dark:text-red-200">{notice}</p> : null}</form>;
}
