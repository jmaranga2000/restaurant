import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LandingNav } from "@/components/ui/LandingNav";

const heroImage = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=90";

const modules = [
  { icon: "⊞", number: "01", title: "Service that moves", description: "Take orders with confidence, connect every table, and keep payments clear.", detail: "POS · Orders · Payments" },
  { icon: "♨", number: "02", title: "A kitchen in sync", description: "Route each item to the right station and give the team a live, focused queue.", detail: "Kitchen Display · Stations · Timers" },
  { icon: "▤", number: "03", title: "Stock with context", description: "Track the real story behind every ingredient, purchase, transfer, and waste entry.", detail: "Inventory · Suppliers · Stock ledger" },
  { icon: "↗", number: "04", title: "A smarter overview", description: "See live performance by branch and find the next operational decision faster.", detail: "Analytics · Reports · Multi-branch" },
];

const workspaces = [
  { number: "01", eyebrow: "For the service team", title: "Restaurant workspace", description: "A focused place to run the floor, kitchen, stock room, and daily service.", href: "/workspace", action: "Open workspace", accent: "bg-indigo-600" },
  { number: "02", eyebrow: "For restaurant owners", title: "Restaurant admin", description: "Configure the menu, branches, users, brand, and operating controls behind every shift.", href: "/admin", action: "Open administration", accent: "bg-emerald-600" },
  { number: "03", eyebrow: "For platform staff", title: "Platform control", description: "Manage the organizations, subscriptions, and health of your Restaurant OS network.", href: "/super-admin/login", action: "Platform login", accent: "bg-amber-500" },
];

function Arrow() {
  return <span aria-hidden="true" className="text-base leading-none">→</span>;
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-paper text-ink dark:bg-ink dark:text-paper">
      <div
        role="img"
        aria-label="Fine dining dish in an elegant restaurant"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center lg:bg-[center_45%]"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-ink/20" />

      <div className="relative z-10">
        

        <LandingNav />

        <section className="relative isolate overflow-hidden border-b border-paper/10 text-paper">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ink/95 via-ink/78 to-ink/40" />
          <div className="mx-auto grid min-h-[calc(100svh-7.25rem)] max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-14 lg:px-14 lg:py-24">
            <div>
              <Badge tone="warning" className="border border-ember-light/30 bg-ember/15 text-ember-light">
                <span className="h-1.5 w-1.5 rounded-full bg-ember-light" /> Restaurant operating system
              </Badge>
              <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.93] tracking-[-0.055em] sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
                One calm system for <span className="text-ember-light">every busy shift.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-paper/75 sm:text-lg sm:leading-8">
                Restaurant OS brings orders, kitchen work, inventory, teams, and branch performance into one clear operating rhythm.
              </p>

              <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row">
                <Button href="/register" className="bg-ember px-5 py-3.5 text-white hover:bg-ember-dark">
                  Start your restaurant <Arrow />
                </Button>
                <Button href="/workspace" variant="secondary" className="border-paper/30 bg-paper/10 px-5 py-3.5 text-ember-dark backdrop-blur hover:border-paper/55 hover:bg-paper/20 dark:border-paper/30 dark:bg-paper/10 dark:text-paper">
                  Open workspace <Arrow />
                </Button>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 border-t border-paper/15 pt-5">
                {["Counter", "Kitchen", "Head office"].map((label, index) => (
                  <div key={label} className={index ? "border-l border-paper/15 pl-4 sm:pl-5" : "pr-4 sm:pr-5"}>
                    <p className="font-display text-2xl text-paper">{["Live", "Clear", "Ready"][index]}</p>
                    <p className="mt-1 text-xs text-paper/55">{label}</p>
                  </div>
                ))}
              </div>
            </div>

           
          </div>
        </section>

        <section id="operations" className="bg-paper px-4 py-16 transition-colors dark:bg-ink sm:px-6 lg:px-14 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 border-b border-ink-line/15 pb-9 dark:border-ink-line lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">One operating rhythm</p>
                <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[0.97] tracking-tight sm:text-5xl">The entire restaurant, connected without the noise.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-ink/60 dark:text-paper/60">Every team works from the same current information, from the moment an order is placed to end-of-day reconciliation.</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {modules.map((module) => (
                <Card key={module.number} className="group flex min-h-[250px] flex-col p-5 transition-transform duration-200 hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-lg text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{module.icon}</span>
                    <span className="text-xs font-medium text-ink/40 dark:text-paper/40">{module.number}</span>
                  </div>
                  <h3 className="mt-8 font-display text-2xl tracking-tight">{module.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/60 dark:text-paper/60">{module.description}</p>
                  <p className="mt-auto pt-6 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-300">{module.detail}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        

        <section id="portals" className="bg-paper px-4 py-16 transition-colors dark:bg-ink sm:px-6 lg:px-14 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Choose your workspace</p>
                <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[0.98] tracking-tight sm:text-5xl">A useful view for every role.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-ink/60 dark:text-paper/60">Start at the place where your work happens. Your access, organization, branches, and role shape the experience.</p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <Card key={workspace.href} className="group relative flex min-h-[300px] flex-col overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-1">
                  <span className={`absolute inset-x-0 top-0 h-1 ${workspace.accent}`} />
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium text-ink/45 dark:text-paper/45">{workspace.number}</span>
                    <span className="text-xl text-ink/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-paper/35">↗</span>
                  </div>
                  <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">{workspace.eyebrow}</p>
                  <h3 className="mt-3 font-display text-2xl tracking-tight">{workspace.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/60 dark:text-paper/60">{workspace.description}</p>
                  <Button href={workspace.href} variant="ghost" className="mt-auto justify-between border border-ink-line/15 px-4 dark:border-ink-line">
                    {workspace.action} <Arrow />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ink px-4 py-16 text-paper sm:px-6 lg:px-14 lg:py-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ember-light">Ready when your team is</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[0.98] tracking-tight sm:text-5xl">Make the next service your clearest one yet.</h2>
            </div>
            <Button href="/register" className="bg-ember px-5 py-3.5 text-white hover:bg-ember-dark">Create your restaurant <Arrow /></Button>
          </div>
        </section>

        <footer className="border-t border-paper/10 bg-ink px-4 pb-9 text-paper sm:px-6 lg:px-14">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-paper/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/" className="font-display text-xl tracking-tight">Restaurant <span className="text-ember-light">OS</span></Link>
              <p className="mt-1 text-sm text-paper/45">Operations, without the noise.</p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-paper/55">
              <Link href="/register" className="hover:text-paper">Create account</Link>
              <Link href="/login" className="hover:text-paper">Restaurant login</Link>
              <Link href="/super-admin/login" className="hover:text-paper">Platform login</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
