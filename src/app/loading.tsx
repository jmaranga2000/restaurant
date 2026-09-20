export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink dark:bg-ink dark:text-paper">
      <div className="flex items-center gap-3" role="status" aria-live="polite">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-ember" />
        <span className="font-medium">Loading Restaurant OS…</span>
      </div>
    </main>
  );
}
