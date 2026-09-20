"use client";

import { useState } from "react";

type PasswordFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  minLength?: number;
  autoComplete?: string;
};

export function PasswordField({
  id = "password",
  name = "password",
  label = "Password",
  minLength,
  autoComplete = "current-password",
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-ink/80 dark:text-paper/80">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full rounded border border-ink-line bg-white px-3 py-2 pr-16 text-ink focus-visible:outline-none dark:bg-ink-soft dark:text-paper"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-ink/65 transition-colors hover:text-ink focus-visible:outline-none dark:text-paper/65 dark:hover:text-paper"
          aria-pressed={isVisible}
          aria-label={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
