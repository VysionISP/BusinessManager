"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage can be unavailable (private browsing, disabled storage) — theme just won't persist
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {/* Icon visibility is driven purely by the .dark class via CSS (no
          React state) so there's nothing for the server and client's first
          render to disagree on — the blocking init script in layout.tsx
          already applied .dark to <html> before this ever paints. */}
      <Sun className="hidden h-4 w-4 dark:block" strokeWidth={2.25} />
      <Moon className="block h-4 w-4 dark:hidden" strokeWidth={2.25} />
    </button>
  );
}
