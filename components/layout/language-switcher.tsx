"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const set = (locale: Locale) => {
    document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-300 text-xs dark:border-slate-700">
      <button type="button" onClick={() => set("en")}
        className={`px-2 py-1 ${current === "en" ? "bg-primary text-primary-foreground" : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100"}`}>EN</button>
      <button type="button" onClick={() => set("ar")}
        className={`px-2 py-1 ${current === "ar" ? "bg-primary text-primary-foreground" : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100"}`}>AR</button>
    </div>
  );
}
