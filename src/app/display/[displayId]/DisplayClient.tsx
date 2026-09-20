"use client";

import { useEffect, useMemo, useState } from "react";

type DisplayOrder = { number: string; location: string; createdAt: string; items: { name: string; quantity: number }[] };
type DisplayMenuItem = { id: string; name: string; description: string; category: string; priceMinor: number; imageUrl?: string };

function displayMoney(minor: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(minor / 100);
}

function timeOfDay(date: Date) {
  return new Intl.DateTimeFormat("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function dayOfWeek(date: Date) {
  return new Intl.DateTimeFormat("en-KE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function DisplayClient({
  displayId,
  branchName,
  restaurantName,
  logoUrl,
  waitingOrders,
  readyOrders,
  menu,
}: {
  displayId: string;
  branchName: string;
  restaurantName: string;
  logoUrl?: string;
  waitingOrders: DisplayOrder[];
  readyOrders: DisplayOrder[];
  menu: DisplayMenuItem[];
}) {
  const [now, setNow] = useState(() => new Date());
  const [promotionIndex, setPromotionIndex] = useState(0);
  const [liveData, setLiveData] = useState({ waitingOrders, readyOrders, menu });
  const menuGroups = useMemo(() => {
    const grouped = new Map<string, DisplayMenuItem[]>();
    for (const item of liveData.menu) {
      const categoryItems = grouped.get(item.category);
      if (categoryItems) categoryItems.push(item);
      else grouped.set(item.category, [item]);
    }
    return Array.from(grouped, ([category, items]) => ({ category, items }));
  }, [liveData.menu]);
  const promotionalItem = liveData.menu.length ? liveData.menu[promotionIndex % liveData.menu.length] : undefined;

  useEffect(() => {
    // Fetch only display data. Refreshing the route remounts the whole screen,
    // resets carousels, and visibly flashes on a TV.
    const refresh = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/display/${displayId}`, { cache: "no-store" });
        if (response.ok) setLiveData(await response.json());
      } catch {
        // A display should remain readable during a short network outage.
      }
    }, 10000);
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const promotionCarousel = window.setInterval(() => setPromotionIndex((current) => current + 1), 7000);
    return () => {
      window.clearInterval(refresh); window.clearInterval(clock); window.clearInterval(promotionCarousel);
    };
  }, [displayId]);

  return (
    <main className="display-shell min-h-screen overflow-hidden bg-[#03101d] text-[#eff8ff]">
      <header className="flex h-[9.2vh] min-h-16 items-center justify-between border-b border-white/10 bg-[#06182a]/95 px-[2vw] shadow-[0_8px_30px_rgba(0,0,0,.3)]">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? <img src={logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffad28] text-xl text-[#06182a]">✦</span>}
          <div className="min-w-0"><h1 className="truncate text-[clamp(1.05rem,2.1vw,2.25rem)] font-bold tracking-tight">{restaurantName}</h1><p className="text-[9px] font-semibold uppercase tracking-[.26em] text-white/50">{branchName} · Good food · Great mood</p></div>
        </div>
        <p className="hidden flex-1 justify-center gap-6 text-center font-serif text-[clamp(.9rem,1.5vw,1.6rem)] italic text-white/90 md:flex"><span>Fresh ingredients</span><i className="not-italic text-[#ffad28]">|</i><span>Bold flavours</span><i className="not-italic text-[#ffad28]">|</i><span>Always made to order</span></p>
        <div className="flex items-center gap-3 border-l border-white/10 pl-4"><span className="text-2xl text-[#ffbc44]">◷</span><div><p className="text-xl font-bold leading-none">{timeOfDay(now)}</p><p className="mt-1 text-[10px] text-white/60">{dayOfWeek(now)}</p></div></div>
      </header>

      <div className="grid h-[83.3vh] grid-cols-[minmax(190px,.95fr)_minmax(440px,1.8fr)_minmax(190px,.95fr)] gap-[.9vw] p-[.9vw] max-[850px]:grid-cols-[1fr_1.6fr] max-[650px]:grid-cols-1 max-[650px]:overflow-y-auto">
        <DisplayOrderColumn title="Waiting orders" count={liveData.waitingOrders.length} orders={liveData.waitingOrders} tone="waiting" />

        <section className="grid min-h-0 grid-cols-[.64fr_1.08fr] gap-[.9vw] max-[850px]:col-span-1 max-[850px]:grid-cols-1 max-[650px]:order-first">
          <aside className="relative hidden min-h-0 overflow-hidden rounded-xl border border-white/10 bg-[#07192a] md:block">
            <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: `url(${promotionalItem?.imageUrl ?? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85"})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05111e] via-[#05111e]/35 to-[#05111e]/20" />
            <div className="relative flex h-full flex-col justify-between p-[2vw]"><div><p className="text-[9px] font-semibold uppercase tracking-[.32em] text-[#ffd070]">Fresh from our kitchen</p><h2 className="mt-[2.5vh] text-[clamp(2rem,4.2vw,5rem)] font-bold leading-[.9] tracking-tight">Freshly made,<br /><span className="font-serif italic text-[#ffad28]">always.</span></h2><p className="mt-[3vh] max-w-44 text-[clamp(.7rem,1vw,1.1rem)] text-white/75">From our kitchen to your table, prepared with care.</p></div><div className="grid grid-cols-3 gap-2 text-center text-[9px] font-semibold text-white/85"><span>◉<b className="mt-1 block">Fresh</b></span><span>◈<b className="mt-1 block">Quality</b></span><span>☆<b className="mt-1 block">Taste</b></span></div></div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#071a2c] p-[1vw] shadow-[0_15px_40px_rgba(0,0,0,.22)]">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-[.8vw]"><p className="text-[clamp(.65rem,.9vw,1rem)] font-semibold uppercase tracking-[.2em] text-[#ffd070]">Our menu</p><span className="text-[clamp(.55rem,.72vw,.78rem)] text-white/50">Freshly prepared to order</span></div>
            <div className="display-menu-window mt-[.8vw] min-h-0 flex-1 overflow-hidden"><MenuReel menuGroups={menuGroups} /></div>
            {promotionalItem ? <div className="mt-[.8vw] flex shrink-0 items-center gap-3 rounded-xl border border-[#f3a420]/80 bg-gradient-to-r from-[#4b2700] to-[#152336] p-[.7vw]"><div className="hidden h-12 w-14 overflow-hidden rounded-lg sm:block">{promotionalItem.imageUrl ? <img src={promotionalItem.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-xl">🍴</span>}</div><div className="min-w-0 flex-1"><p className="font-semibold text-[#ffbf47]">Today’s featured pick</p><p className="truncate text-xs text-white/65">{promotionalItem.name} · {displayMoney(promotionalItem.priceMinor)}</p></div><span className="rounded-full bg-[#ffad28] px-3 py-2 text-xs font-bold text-[#07111d]">View menu →</span></div> : null}
          </section>
        </section>

        <DisplayOrderColumn title="Ready orders" count={liveData.readyOrders.length} orders={liveData.readyOrders} tone="ready" />
      </div>

      <footer className="flex h-[7.5vh] min-h-14 items-center justify-between gap-4 border-t border-white/10 bg-[#071521] px-[2vw] text-[clamp(.62rem,.95vw,1rem)]"><p className="font-semibold text-[#ffba3c]">⌁ Today’s special <span className="mx-3 text-white/40">|</span><span className="font-normal text-white/85">Fresh ingredients, better taste!</span></p><div className="hidden items-center gap-2 text-white/65 md:flex"><span className="grid h-7 w-7 place-items-center border border-white/40">▦</span><span className="text-xs">Scan for digital menu</span></div><p className="font-serif text-lg italic text-white/85">Thank you! <span className="ml-1 text-[#ffad28]">♥</span></p></footer>
      <style>{`@keyframes display-menu-roll { from { transform: translateY(0); } to { transform: translateY(-50%); } } .display-menu-reel { animation: display-menu-roll 52s linear infinite; will-change: transform; } .display-menu-window:hover .display-menu-reel { animation-play-state: paused; } @media (prefers-reduced-motion: reduce) { .display-menu-reel { animation: none; } }`}</style>
    </main>
  );
}

function MenuReel({ menuGroups }: { menuGroups: { category: string; items: DisplayMenuItem[] }[] }) {
  if (!menuGroups.length) {
    return <div className="grid h-full min-h-64 place-items-center rounded-xl border border-dashed border-white/15 text-center text-sm text-white/55">Create menu items in Restaurant Admin<br />to show them here.</div>;
  }

  // Repeating the full catalog keeps the upward reel visually continuous,
  // even for a restaurant that currently has only a handful of items.
  return (
    <div className="display-menu-reel space-y-[1vw] pb-[1vw]">
      {Array.from({ length: 12 }, (_, cycle) => menuGroups.map((group) => (
        <section key={`${cycle}-${group.category}`} aria-hidden={cycle > 0} className="space-y-[.55vw]">
          <div className="flex items-center gap-3 px-1 pt-[.4vw]">
            <h2 className="whitespace-nowrap text-[clamp(.85rem,1.25vw,1.4rem)] font-bold uppercase tracking-[.12em] text-[#ffbd45]">{group.category}</h2>
            <span className="h-px flex-1 bg-[#ffbd45]/30" />
          </div>
          {group.items.map((item) => (
            <article key={`${cycle}-${group.category}-${item.id}`} className="grid grid-cols-[clamp(48px,6vw,82px)_1fr_auto] items-center gap-[.7vw] rounded-xl border border-white/10 bg-[#0a2035] p-[.58vw] shadow-[0_6px_18px_rgba(0,0,0,.16)]">
              <div className="aspect-square overflow-hidden rounded-lg bg-[#102d46]">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[clamp(1rem,2vw,2rem)]">🍽</div>}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[clamp(.74rem,1.05vw,1.15rem)] font-bold">{item.name}</h3>
                <p className="mt-1 line-clamp-2 text-[clamp(.54rem,.7vw,.78rem)] leading-relaxed text-white/65">{item.description}</p>
              </div>
              <b className="whitespace-nowrap text-[clamp(.7rem,.92vw,1rem)] text-[#fff4dc]">{displayMoney(item.priceMinor)}</b>
            </article>
          ))}
        </section>
      )))}
    </div>
  );
}

function DisplayOrderColumn({ title, count, orders, tone }: { title: string; count: number; orders: DisplayOrder[]; tone: "waiting" | "ready" }) {
  const isReady = tone === "ready";
  const panelClass = isReady
    ? "border-emerald-400/55 bg-[#09312f]"
    : "border-[#d78d1b]/55 bg-[#2d2416]";
  const headingClass = isReady
    ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-300"
    : "border-[#cf8c28]/55 bg-[#c47712]/10 text-[#ffbc3f]";

  return (
    <section className={`min-h-0 overflow-hidden rounded-xl border p-[.7vw] ${panelClass}`}>
      <div className={`flex items-center justify-between rounded-lg border px-[1vw] py-[.8vw] ${headingClass}`}>
        <h2 className="text-[clamp(.8rem,1.25vw,1.4rem)] font-bold uppercase tracking-wide">
          {isReady ? "✓" : "◷"} {title}
        </h2>
        <span className={`grid h-8 min-w-8 place-items-center rounded-full text-sm font-bold ${isReady ? "bg-emerald-400 text-[#052319]" : "bg-[#ffad28] text-[#2e1900]"}`}>
          {count}
        </span>
      </div>
      <div className="mt-[.8vw] max-h-[calc(100%-60px)] space-y-[.6vw] overflow-y-auto pr-1">
        {orders.map((order) => (
          <article key={order.number} className={`rounded-lg border border-white/10 bg-[#0a2035]/95 p-[.8vw] shadow-[0_5px_15px_rgba(0,0,0,.18)] ${isReady ? "border-l-[5px] border-l-emerald-400" : "border-l-[5px] border-l-[#ffad28]"}`}>
            <div className="flex justify-between gap-2">
              <div>
                <h3 className="text-[clamp(.78rem,1.1vw,1.2rem)] font-bold">#{order.number}</h3>
                <p className="mt-1 text-[clamp(.6rem,.8vw,.9rem)] text-white/65">{order.location}</p>
              </div>
              <time className="text-[clamp(.55rem,.75vw,.85rem)] text-white/60">
                {new Intl.DateTimeFormat("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(order.createdAt))}
              </time>
            </div>
            <div className="mt-2 space-y-1 text-[clamp(.57rem,.72vw,.8rem)] text-white/80">
              {order.items.map((item, index) => <p key={`${item.name}-${index}`}><span className="mr-1 text-white/50">{item.quantity} ×</span>{item.name}</p>)}
            </div>
            <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[clamp(.5rem,.65vw,.7rem)] font-bold ${isReady ? "bg-emerald-500/25 text-emerald-300" : "bg-[#b57614]/35 text-[#ffc152]"}`}>
              {isReady ? "Ready" : "Waiting"}
            </span>
          </article>
        ))}
        {!orders.length ? <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-white/15 p-5 text-center text-sm text-white/45">No orders right now</div> : null}
      </div>
    </section>
  );
}
