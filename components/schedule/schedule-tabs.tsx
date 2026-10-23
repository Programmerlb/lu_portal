import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/schedule/main", label: "Main" },
  { href: "/schedule/today", label: "Today" },
  { href: "/schedule/tomorrow", label: "Tomorrow" },
  { href: "/schedule/week", label: "Week" },
  { href: "/schedule/month", label: "Month" },
  { href: "/schedule/changes", label: "Changes" },
];

export function ScheduleTabs({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200 pb-2" aria-label="Schedule views">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition",
            active === t.href ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100"
          )}
          aria-current={active === t.href ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
