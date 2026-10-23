import Link from "next/link";

export interface UrgentItem { id: string; title: string; requires_acknowledgment: boolean; }

export function UrgentBanner({ items }: { items: UrgentItem[] }) {
  if (items.length === 0) return null;
  const first = items[0];
  const more = items.length - 1;
  return (
    <div className="border-b border-red-200 bg-red-50">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2 text-sm">
        <span className="mt-0.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Urgent
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/announcements/${first.id}`} className="font-medium text-red-900 hover:underline">
            {first.title}
          </Link>
          {first.requires_acknowledgment && (
            <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
              Acknowledgment required
            </span>
          )}
          {more > 0 && (
            <Link href="/announcements?category=urgent" className="ml-2 text-red-700 hover:underline">
              +{more} more
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
