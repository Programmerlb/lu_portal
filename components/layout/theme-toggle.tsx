"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="inline-block h-7 w-14 rounded-md bg-slate-100" aria-hidden />;
  const current = resolvedTheme ?? theme ?? "light";
  return (
    <button type="button" aria-label="Toggle theme"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
      {current === "dark" ? "🌙 Dark" : "☀ Light"}
    </button>
  );
}
