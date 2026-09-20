import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const capabilities = [
  { number: "01", title: "Every order, in flow", description: "A single ticket moves from the counter to the kitchen and table without a handoff getting lost.", detail: "POS · Kitchen display · Customer screen" },
  { number: "02", title: "Stock that stays honest", description: "Know what each branch has, what it is using, and what needs attention before service begins.", detail: "Inventory · Suppliers · Movement history" },
  { number: "03", title: "A clearer picture upstairs", description: "Give managers a live view of the numbers and operations that shape a stronger shift.", detail: "Branches · Reports · Team controls" },
];

const portalLinks = [
  { eyebrow: "For restaurant teams", title: "Step into service", description: "Take orders, keep the kitchen moving, manage stock, and see how every branch is performing.", href: "/login", action: "Restaurant login", number: "01", tone: "bg-ember text-white hover:bg-ember-dark" },
  { eyebrow: "For platform staff", title: "Oversee the network", description: "Review restaurants, manage account health, and keep the Restaurant OS platform running smoothly.", href: "/super-admin/login", action: "Super Admin login", number: "02", tone: "border border-ink-line bg-ink-soft text-paper hover:bg-ink-line" },
];

const heroImage = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=90";

function ArrowUpRight({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block text-lg leading-none ${className}`}>↗</span>;
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-ink dark:text-paper">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center lg:bg-[center_45%]"
        style={{ backgroundImage: `url(${heroImage})` }}
        role="img"
        aria-label="Fine dining dish in an elegant restaurant"
      />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-ink/10" />

      <div className="relative z-10">
      <div className="border-b border-ink/10 bg-ink/95 text-paper backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.16em] sm:px-10">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-ember-light" />
          Built for the pace of service
        </div>
      </div>

      <header className="mx-auto flex max-w-7xl items-center justify-between bg-paper/90 px-6 py-5 backdrop-blur-sm dark:bg-ink/90 sm:px-10 lg:px-14 lg:py-7">
        <Link href="/" className="font-display text-xl tracking-tight sm:text-2xl">
          Restaurant <span className="text-ember">OS</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.17em] text-ink/45 dark:text-paper/45 sm:inline">Operations, in sync</span>
          <ThemeToggle />
          <Link href="/login" className="group inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-ember dark:text-paper">
            Sign in <ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </header>

      <section className="relative isolate min-h-[calc(100svh-7.6rem)] overflow-hidden text-paper">
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/10" />
        <div className="mx-auto grid min-h-[calc(100svh-7.6rem)] max-w-7xl gap-12 px-6 pb-20 pt-14 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:px-14 lg:pb-28 lg:pt-20">
        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <p className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ember-light">
              <span className="h-px w-9 bg-ember" /> Restaurant operations platform
            </p>
            <h1 className="max-w-2xl font-display text-5xl leading-[0.91] tracking-[-0.045em] [text-shadow:0_2px_18px_rgb(20_24_29_/_0.55)] sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
              Make every shift feel <span className="italic text-ember-light">under control.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-paper/75 sm:text-lg sm:leading-8">
              Restaurant OS connects the counter, the kitchen, the stock room, and head office — so your team can focus on the guests in front of them.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
            <Link href="/register" className="group inline-flex items-center justify-center gap-3 bg-ember px-5 py-3.5 text-sm font-medium text-white transition-colors hover:bg-ember-dark sm:w-auto">
              Start your restaurant <ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-paper/55">Built for one location or one hundred</p>
          </div>
        </div>

        <div className="relative lg:col-span-6">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-ember/15 blur-3xl" />
          <div className="relative overflow-hidden border border-paper/15 bg-ink/90 p-5 text-paper shadow-[10px_12px_0_0_#e0a56f] backdrop-blur-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-paper/15 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ember font-display text-sm">R</span>
                <div>
                  <p className="text-sm font-medium">Riverside Kitchen</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-paper/40">Downtown branch</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-paper/15 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.13em] text-paper/60">
                <span className="h-1.5 w-1.5 rounded-full bg-status-ready" /> Live service
              </div>
            </div>

            <div className="grid gap-4 py-6 sm:grid-cols-[1.15fr_.85fr]">
              <div className="border border-paper/15 bg-paper/[0.04] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-paper/45">Open orders</p>
                    <p className="mt-2 font-display text-4xl tracking-tight">18</p>
                  </div>
                  <span className="bg-ember/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ember-light">+4 now</span>
                </div>
                <div className="mt-5 space-y-2.5">
                  {[
                    ["#1042", "Table 08", "Preparing", "bg-status-preparing"],
                    ["#1043", "Counter", "Ready", "bg-status-ready"],
                    ["#1044", "Table 03", "Queued", "bg-status-waiting"],
                  ].map(([order, table, status, color]) => (
                    <div key={order} className="flex items-center justify-between border-t border-paper/10 pt-2.5 text-xs">
                      <span className="text-paper/90"><span className="mr-2 font-mono text-[10px] text-paper/35">{order}</span>{table}</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-paper/55"><span className={`h-1.5 w-1.5 rounded-full ${color}`} />{status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between bg-ember p-4 text-white">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/65">Today’s sales</p>
                  <p className="mt-2 font-display text-3xl tracking-tight">$2,840</p>
                  <p className="mt-1 text-xs text-white/70">Up 12.8% from last Tuesday</p>
                </div>
                <div className="mt-8 flex h-11 items-end gap-1.5">
                  {[34, 53, 42, 69, 58, 82, 66, 93, 76, 100].map((height, index) => (
                    <span key={index} className="flex-1 bg-white/75" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-paper/15 pt-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-paper/45">Service pulse · 12:48 PM</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ember-light">Everything in motion</span>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-paper-dim transition-colors duration-300 dark:border-ink-line dark:bg-ink-soft">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-14 lg:py-20">
          <div className="flex flex-col justify-between gap-5 border-b border-ink/10 pb-10 dark:border-ink-line sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">One operating rhythm</p>
              <h2 className="mt-3 max-w-xl font-display text-4xl leading-[0.98] tracking-tight sm:text-5xl">Less chasing. More knowing.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-ink/60 dark:text-paper/60">The work is connected from the moment an order lands to the moment a manager reviews the day.</p>
          </div>

          <div className="grid divide-y divide-ink/10 dark:divide-ink-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {capabilities.map((capability, index) => (
              <article key={capability.number} className={`py-9 lg:px-8 lg:py-10 ${index === 0 ? "lg:pl-0" : ""} ${index === capabilities.length - 1 ? "lg:pr-0" : ""}`}>
                <span className="font-mono text-[11px] text-ember">{capability.number}</span>
                <h3 className="mt-10 font-display text-2xl tracking-tight">{capability.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-ink/60 dark:text-paper/60">{capability.description}</p>
                <p className="mt-7 font-mono text-[9px] uppercase tracking-[0.13em] text-ink/50 dark:text-paper/50">{capability.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper px-6 py-20 transition-colors duration-300 dark:bg-ink sm:px-10 lg:px-14 lg:py-28" id="portals">
        <div className="mx-auto max-w-7xl">
        <div className="grid gap-9 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ember">Choose your workspace</p>
            <h2 className="mt-4 max-w-md font-display text-4xl leading-[0.98] tracking-tight sm:text-5xl">The right view for every role.</h2>
            <p className="mt-6 max-w-sm text-sm leading-6 text-ink/60 dark:text-paper/60">Start where you work. Each workspace is designed around the decisions your team makes every day.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {portalLinks.map((portal) => (
              <Link key={portal.href} href={portal.href} className="group flex min-h-[290px] flex-col justify-between border border-ink/15 bg-paper p-6 transition-all hover:-translate-y-1 hover:border-ink/35 hover:shadow-[6px_6px_0_0_#14181d] dark:border-ink-line dark:bg-ink-soft dark:hover:border-paper/40 dark:hover:shadow-[6px_6px_0_0_#e0a56f]">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[10px] text-ink/40 dark:text-paper/40">{portal.number}</span>
                    <ArrowUpRight className="text-ink/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-paper/40" />
                  </div>
                  <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.15em] text-ember">{portal.eyebrow}</p>
                  <h3 className="mt-3 font-display text-2xl tracking-tight">{portal.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/60 dark:text-paper/60">{portal.description}</p>
                </div>
                <span className={`mt-7 inline-flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${portal.tone}`}>
                  {portal.action} <ArrowUpRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
        </div>
      </section>

      <footer className="bg-ink text-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-9 sm:px-10 sm:py-10 lg:flex-row lg:items-end lg:justify-between lg:px-14">
          <div>
            <Link href="/" className="font-display text-xl tracking-tight">Restaurant <span className="text-ember-light">OS</span></Link>
            <p className="mt-2 text-sm text-paper/45">Operations, without the noise.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/50">
            <Link href="/register" className="hover:text-paper">Create an account</Link>
            <Link href="/login" className="hover:text-paper">Restaurant login</Link>
            <Link href="/super-admin/login" className="hover:text-paper">Platform login</Link>
          </div>
        </div>
      </footer>
      </div>
    </main>
  );
}
