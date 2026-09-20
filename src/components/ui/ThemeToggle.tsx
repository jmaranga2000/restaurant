"use client";

import { useEffect, useState } from "react";

const storageKey = "restaurant-os-theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(storageKey);
    const shouldUseDark = savedTheme === "dark";

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
    document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;

    setIsDark(nextIsDark);
    window.localStorage.setItem(storageKey, nextIsDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", nextIsDark);
    document.documentElement.style.colorScheme = nextIsDark ? "dark" : "light";
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="group inline-flex h-9 items-center gap-2 border border-ink/15 px-3 text-xs font-medium text-ink transition-colors hover:border-ink/35 hover:bg-paper-dim dark:border-paper/20 dark:text-paper dark:hover:border-paper/45 dark:hover:bg-paper/10"
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.7]">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.7]">
          <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z" />
        </svg>
      )}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
