# LU Branch 5 — Master's Academic Portal

Production-oriented academic portal for the Master's programs at Lebanese University, Branch 5. Centralizes courses, lectures, resources, schedules, announcements, notifications, and role-based workflows for admins, doctors, the class representative (مندوب), and students.

> **Stack:** Next.js 15 (App Router, TS, RSC) · Tailwind CSS · Supabase (PostgreSQL, Auth, Storage, Realtime) · Vitest · Vercel.

## Highlights

- **Correct schedule engine.** Recurring semester timetable kept strictly separate from date-specific exceptions; the actual schedule is computed, tested, and Asia/Beirut-safe. Pending requests never affect the published schedule.
- **Security enforced in the database.** Every table has RLS. Role escalation is blocked by a trigger. Signed URLs for private files. Service-role key never leaves the server.
- **Announcements with receipts.** Six categories, attachments, read/acknowledgment tracking, urgent banner, notification fan-out via DB trigger, realtime bell.
- **Bilingual + dark mode.** EN/AR with proper RTL, light/dark, mobile drawer navigation.
- **Role dashboards.** Admin: counts and approvals. Doctor: assigned courses and pending confirmations. Rep: today's schedule and change requests. Student: today/tomorrow/exams/courses.

## Quickstart

```bash
npm install
npx supabase start
cp .env.example .env.local           # paste URL + anon key
npx supabase db reset                # runs 0001..0011 + seed
# create demo accounts in Studio, then:
npm run dev                          # http://localhost:3000

