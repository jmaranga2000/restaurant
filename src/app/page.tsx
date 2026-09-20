import Link from "next/link";

const portalLinks = [
  {
    eyebrow: "For restaurant teams",
    title: "Run your restaurant",
    description: "Open the POS, manage kitchen orders, track inventory, and see branch performance.",
    href: "/login",
    action: "Restaurant login",
    accent: "bg-ember hover:bg-ember-dark",
    number: "01",
  },
  {
    eyebrow: "For platform staff",
    title: "Manage the platform",
    description: "Review organizations, oversee account health, and manage the Restaurant OS network.",
    href: "/super-admin/login",
    action: "Super Admin login",
    accent: "bg-ink-soft hover:bg-ink-line",
    number: "02",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-ink text-paper">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between border-b border-ink-line pb-5">
          <Link href="/" className="font-display text-lg tracking-tight">
            Restaurant <span className="text-ember-light">OS</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/40">Choose your portal</span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:py-20">
          <div className="max-w-xl">
            <p className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-ember-light">
              <span className="h-px w-8 bg-ember-light" />
              One system. Every service.
            </p>
            <h1 className="max-w-lg font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              The calm behind a busy restaurant.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-paper/60 sm:text-lg">
              Restaurant OS brings the front counter, kitchen, stock room, and head office into one clear operating view.
            </p>
            <div className="mt-10 flex items-center gap-5 text-sm text-paper/45">
              <span className="font-mono text-ember-light">24/7</span>
              <span className="h-1 w-1 rounded-full bg-paper/30" />
              <span>Built for service teams</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {portalLinks.map((portal) => (
              <Link
                key={portal.href}
                href={portal.href}
                className="group flex min-h-[315px] flex-col justify-between border border-ink-line bg-ink/40 p-6 transition-colors hover:border-paper/30 sm:p-7"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs text-paper/35">{portal.number}</span>
                    <span className="text-2xl text-paper/35 transition-transform group-hover:translate-x-1">↗</span>
                  </div>
                  <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.18em] text-ember-light">{portal.eyebrow}</p>
                  <h2 className="mt-3 font-display text-2xl tracking-tight text-paper">{portal.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-paper/50">{portal.description}</p>
                </div>
                <span className={`mt-8 inline-flex w-full items-center justify-center px-4 py-3 text-sm font-medium text-white transition-colors ${portal.accent}`}>
                  {portal.action}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-ink-line pt-5 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <span>Restaurant OS · Operations, without the noise.</span>
          <Link href="/register" className="text-paper/60 underline decoration-paper/30 underline-offset-4 hover:text-paper">
            Start a new restaurant
          </Link>
        </footer>
      </div>
    </main>
  );
}