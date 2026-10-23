"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "official", label: "Official" },
  { value: "doctor", label: "Doctor" },
  { value: "representative", label: "Representative" },
  { value: "majles_tolab", label: "Majles al-Tolab" },
  { value: "urgent", label: "Urgent" },
  { value: "course", label: "Course" },
];

export function AnnouncementFilters({ courses }: { courses: { id: string; code: string; name_en: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    router.push(`/announcements?${next.toString()}`);
  }, [params, router]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <select value={params.get("category") ?? ""} onChange={(e) => update("category", e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
        {CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
      </select>
      <select value={params.get("course") ?? ""} onChange={(e) => update("course", e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
        <option value="">All courses</option>
        {courses.map((c) => (<option key={c.id} value={c.id}>{c.code} · {c.name_en}</option>))}
      </select>
      <form onSubmit={(e) => {
        e.preventDefault();
        update("q", (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value);
      }}>
        <input name="q" defaultValue={params.get("q") ?? ""} placeholder="Search title or body…"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
      </form>
    </div>
  );
}
