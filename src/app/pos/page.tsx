import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";

const tools = [
  { href: "/pos/register", icon: "▣", title: "Register", description: "Start a sale, take payment, and send the ticket to the kitchen." },
  { href: "/pos/orders", icon: "◷", title: "Orders", description: "Review the service queue, payments, and recent ticket details." },
  { href: "/pos/loyalty", icon: "◎", title: "Loyalty", description: "Enroll guests, manage points, and redeem rewards." },
];

export default async function PosPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.POS_ACCESS);

  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Cashier portal" title="Point of sale" description="Choose the part of the sales workspace you need for this shift." actions={<Button href="/pos/register">Open register <span aria-hidden="true">→</span></Button>} /><section className="mt-8 grid gap-4 md:grid-cols-3">{tools.map((tool) => <Card key={tool.href} className="flex flex-col p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-xl text-white" aria-hidden="true">{tool.icon}</span><h2 className="mt-5 font-display text-xl text-ink dark:text-paper">{tool.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-ink/60 dark:text-paper/65">{tool.description}</p><Button href={tool.href} variant="secondary" size="sm" className="mt-5 self-start">Open {tool.title}</Button></Card>)}</section></div>;
}