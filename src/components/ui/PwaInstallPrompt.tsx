"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;

    function captureInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (!installPrompt || dismissed) return null;

  return (
    <aside className="fixed bottom-4 left-4 z-[70] max-w-sm rounded-xl border border-ink-line/20 bg-white p-4 shadow-xl dark:border-ink-line dark:bg-ink-soft" aria-label="Install Restaurant OS">
      <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-display text-lg text-white" aria-hidden="true">R</span><div><p className="text-sm font-semibold text-ink dark:text-paper">Install Restaurant OS</p><p className="mt-1 text-xs leading-5 text-ink/60 dark:text-paper/60">Install the app for a faster, full-screen workspace.</p><div className="mt-3 flex items-center gap-3"><button type="button" onClick={installApp} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700">Install app</button><button type="button" onClick={() => setDismissed(true)} className="text-xs text-ink/55 hover:text-ink dark:text-paper/60 dark:hover:text-paper">Not now</button></div></div></div>
    </aside>
  );
}
