"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

export interface NavItem { href: Route; label: string; }

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm md:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        aria-label="Open menu">☰</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setOpen(false)}
          role="dialog" aria-modal="true">
          <div className="absolute inset-y-0 start-0 w-72 max-w-[85%] overflow-y-auto bg-white p-4 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold dark:text-slate-100">Menu</span>
              <button onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-100"
                aria-label="Close menu">✕</button>
            </div>
            <nav className="space-y-1">
              {items.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
