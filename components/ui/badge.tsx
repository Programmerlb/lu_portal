import { cn } from "@/lib/utils";

export function Badge({ className, variant = "neutral", ...p }:
  React.HTMLAttributes<HTMLSpanElement> &
  { variant?: "neutral" | "primary" | "success" | "warning" | "danger" }) {
  const map = {
    neutral: "bg-slate-100 text-slate-700",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-700",
  } as const;
  return <span className={cn(
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
    map[variant], className)} {...p} />;
}
