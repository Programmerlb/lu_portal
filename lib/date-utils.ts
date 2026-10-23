import { formatInTimeZone } from "date-fns-tz";
import { APP_TIMEZONE } from "./constants";

export function todayInTz(tz = APP_TIMEZONE): string {
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
}

export function tomorrowInTz(tz = APP_TIMEZONE): string {
  return addDaysToDateString(todayInTz(tz), 1);
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dowFromDateString(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getUTCDay();
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

export function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
}

export function formatLongDate(dateStr: string, locale: "en" | "ar" = "en"): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString(locale === "ar" ? "ar-LB" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

export function startOfWeek(dateStr: string): string {
  const dow = dowFromDateString(dateStr);
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDaysToDateString(dateStr, offset);
}

export function weekDates(startDate: string, days = 7): string[] {
  return Array.from({ length: days }, (_, i) => addDaysToDateString(startDate, i));
}

export function monthDates(year: number, month: number): string[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  const out: string[] = [];
  for (let d = first.getUTCDate(); d <= last.getUTCDate(); d++) {
    out.push(new Date(Date.UTC(year, month - 1, d)).toISOString().slice(0, 10));
  }
  return out;
}
