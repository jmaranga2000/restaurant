"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  branchName: string;
  waitingOrderNumbers: string[];
  readyOrderNumbers: string[];
}

// Placeholder signage — the Digital Signage Management module (spec §13)
// would feed this panel from scheduled slides/promotions instead.
const SAMPLE_SLIDES = [
  { title: "Ask about today's chef special", body: "Fresh off the grill, made to order." },
  { title: "Loyalty rewards", body: "Earn points on every visit — ask your server to link your account." },
  { title: "Free WiFi", body: "Scan the QR code on your table to connect." },
];

export function DisplayClient({ branchName, waitingOrderNumbers, readyOrderNumbers }: Props) {
  const router = useRouter();

  // Interim polling transport — replace with a subscription to
  // branchChannel(branchId, "display") once a realtime provider is wired in.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="grid h-screen w-screen grid-rows-[auto_1fr] overflow-hidden bg-paper text-ink dark:bg-ink dark:text-paper">
      <header className="text-center py-4 border-b border-ink-line">
        <h1 className="font-display text-2xl tracking-wide">{branchName}</h1>
      </header>

      <div className="grid grid-cols-[1fr_1.4fr_1fr] min-h-0">
        <OrderColumn title="Preparing" numbers={waitingOrderNumbers} accent="text-status-waiting" />

        <div className="relative overflow-hidden border-x border-ink-line">
          <div className="animate-marquee flex flex-col gap-8 px-8 py-8">
            {[...SAMPLE_SLIDES, ...SAMPLE_SLIDES].map((slide, idx) => (
              <div key={idx} className="text-center">
                <p className="font-display text-3xl mb-2">{slide.title}</p>
                <p className="text-ink/60 dark:text-paper/60">{slide.body}</p>
              </div>
            ))}
          </div>
        </div>

        <OrderColumn title="Ready for pickup" numbers={readyOrderNumbers} accent="text-status-ready" />
      </div>

      <style>{`
        @keyframes marquee-up {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        .animate-marquee {
          animation: marquee-up 30s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee { animation: none; }
        }
      `}</style>
    </div>
  );
}

function OrderColumn({ title, numbers, accent }: { title: string; numbers: string[]; accent: string }) {
  return (
    <div className="p-6 overflow-y-auto">
      <h2 className="mb-4 text-sm uppercase tracking-wide text-ink/50 dark:text-paper/50">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {numbers.map((n) => (
          <div key={n} className={`font-mono text-3xl font-medium ${accent}`}>
            #{n}
          </div>
        ))}
        {numbers.length === 0 && <p className="col-span-2 text-sm text-ink/30 dark:text-paper/30">None right now</p>}
      </div>
    </div>
  );
}
