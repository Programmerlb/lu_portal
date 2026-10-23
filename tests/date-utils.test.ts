import { describe, it, expect } from "vitest";
import {
  addDaysToDateString, dowFromDateString, isValidIsoDate, monthDates,
  startOfWeek, timeToMinutes, weekDates,
} from "@/lib/date-utils";

describe("addDaysToDateString", () => {
  it("crosses a month boundary", () => expect(addDaysToDateString("2026-01-31", 1)).toBe("2026-02-01"));
  it("crosses a year boundary", () => expect(addDaysToDateString("2026-12-31", 1)).toBe("2027-01-01"));
  it("handles leap years", () => expect(addDaysToDateString("2024-02-28", 1)).toBe("2024-02-29"));
});

describe("dowFromDateString", () => {
  it("knows real weekdays", () => {
    expect(dowFromDateString("2026-01-05")).toBe(1);
    expect(dowFromDateString("2026-01-11")).toBe(0);
  });
});

describe("timeToMinutes", () => {
  it("converts correctly", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("23:59")).toBe(1439);
  });
});

describe("isValidIsoDate", () => {
  it("accepts valid", () => expect(isValidIsoDate("2026-01-15")).toBe(true));
  it("rejects wrong format", () => expect(isValidIsoDate("01/15/2026")).toBe(false));
  it("rejects impossible dates", () => expect(isValidIsoDate("2026-02-30")).toBe(false));
});

describe("startOfWeek", () => {
  it("returns Monday for Wednesday", () => expect(startOfWeek("2026-01-07")).toBe("2026-01-05"));
  it("returns previous Monday for Sunday", () => expect(startOfWeek("2026-01-11")).toBe("2026-01-05"));
});

describe("weekDates", () => {
  it("returns 7 sequential dates", () => {
    expect(weekDates("2026-01-05")).toEqual([
      "2026-01-05","2026-01-06","2026-01-07","2026-01-08","2026-01-09","2026-01-10","2026-01-11",
    ]);
  });
});

describe("monthDates", () => {
  it("returns all dates for January 2026", () => {
    expect(monthDates(2026, 1)).toHaveLength(31);
    expect(monthDates(2026, 1)[0]).toBe("2026-01-01");
  });
  it("returns 29 days for Feb 2024", () => expect(monthDates(2024, 2)).toHaveLength(29));
});
