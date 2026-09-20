"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallButton({ compact = false }: { compact?: boolean }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
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

  if (!installPrompt) return null;

  return (
    <button
      type="button"
      onClick={installApp}
      className={`inline-flex items-center justify-center gap-2 border border-ink/15 text-xs font-medium text-ink transition-colors hover:border-ink/35 hover:bg-paper-dim dark:border-paper/20 dark:text-paper dark:hover:border-paper/45 dark:hover:bg-paper/10 ${compact ? "h-9 px-3" : "px-4 py-3"}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
        <path d="M12 3v11M8 10l4 4 4-4M5 17.5v2h14v-2" />
      </svg>
      Install app
    </button>
  );
}
