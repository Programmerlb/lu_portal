import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type Role } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UrgentBanner, type UrgentItem } from "@/components/announcements/urgent-banner";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav, type NavItem } from "@/components/layout/mobile-nav";

const roleLabel: Record<Role, { en: string; ar: string }> = {
  admin: { en: "Administrator", ar: "إدارة المنصة" },
  doctor: { en: "Doctor", ar: "الدكتور" },
  representative: { en: "Representative", ar: "المندوب" },
  student: { en: "Student", ar: "الطالب" },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { t, locale } = await getT();

  const [{ data: profile }, { count }, { data: recentNotifications }, { data: urgent }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, email, role").eq("id", user.id).single(),
      supabase.from("notifications").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("is_read", false),
      supabase.from("notifications").select("id, kind, title, link, created_at")
        .eq("user_id", user.id).eq("is_read", false)
        .order("created_at", { ascending: false }).limit(10),
      supabase.from("announcements")
        .select("id, title, requires_acknowledgment, priority")
        .eq("status", "published").eq("priority", "urgent")
        .order("published_at", { ascending: false }).limit(5),
    ]);

  const role = (profile?.role ?? "student") as Role;
  const home = ROLE_HOME[role];

  const urgentIds = (urgent ?? []).map((u) => u.id);
  let visibleUrgent: UrgentItem[] = [];
  if (urgentIds.length > 0) {
    const { data: reads } = await supabase.from("announcement_reads")
      .select("announcement_id, acknowledged")
      .eq("user_id", user.id).in("announcement_id", urgentIds);
    const readMap = new Map((reads ?? []).map((r) => [r.announcement_id, r.acknowledged]));
    visibleUrgent = (urgent ?? []).filter((u) => {
      const acked = readMap.get(u.id);
      if (u.requires_acknowledgment) return !acked;
      return !readMap.has(u.id);
    }).map((u) => ({ id: u.id, title: u.title, requires_acknowledgment: u.requires_acknowledgment }));
  }

  const baseNav = (items: NavItem[]) => [
    { href: home, label: t("nav.dashboard") },
    ...items,
    { href: "/profile", label: t("nav.profile") },
  ];

  const nav: NavItem[] =
    role === "admin"
      ? baseNav([
          { href: "/admin/courses", label: t("nav.courses") },
          { href: "/admin/semesters", label: "Semesters" },
          { href: "/schedule/main", label: t("nav.mainSchedule") },
          { href: "/schedule/changes", label: t("nav.changeRequests") },
          { href: "/announcements", label: t("nav.announcements") },
          { href: "/calendar", label: t("nav.calendar") },
          { href: "/notifications", label: t("nav.notifications") },
        ])
      : role === "doctor"
        ? baseNav([
            { href: "/courses", label: t("nav.myCourses") },
            { href: "/schedule/main", label: t("nav.mainSchedule") },
            { href: "/schedule/changes", label: t("nav.changeRequests") },
            { href: "/announcements", label: t("nav.announcements") },
            { href: "/calendar", label: t("nav.calendar") },
            { href: "/notifications", label: t("nav.notifications") },
          ])
        : role === "representative"
          ? baseNav([
              { href: "/schedule/today", label: t("nav.today") },
              { href: "/schedule/tomorrow", label: t("nav.tomorrow") },
              { href: "/schedule/main", label: t("nav.mainSchedule") },
              { href: "/schedule/changes", label: t("nav.changeRequests") },
              { href: "/announcements", label: t("nav.announcements") },
              { href: "/calendar", label: t("nav.calendar") },
              { href: "/notifications", label: t("nav.notifications") },
            ])
          : baseNav([
              { href: "/courses", label: t("nav.courses") },
              { href: "/schedule/today", label: t("nav.today") },
              { href: "/schedule/tomorrow", label: t("nav.tomorrow") },
              { href: "/schedule/main", label: t("nav.mainSchedule") },
              { href: "/announcements", label: t("nav.announcements") },
              { href: "/calendar", label: t("nav.calendar") },
              { href: "/notifications", label: t("nav.notifications") },
            ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <MobileNav items={nav} />
            <Link href={home} className="font-semibold text-primary">LU Branch 5 · Master&apos;s</Link>
            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 sm:inline dark:bg-slate-800 dark:text-slate-300">
              {roleLabel[role][locale]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={locale} />
            <ThemeToggle />
            <NotificationBell userId={user.id} initialItems={recentNotifications ?? []} initialCount={count ?? 0} />
            <form action="/api/auth/sign-out" method="post">
              <button type="submit"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                {t("nav.signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <UrgentBanner items={visibleUrgent} />

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
