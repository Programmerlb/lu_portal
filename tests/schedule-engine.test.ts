import { describe, it, expect } from "vitest";
import { computeActualSessions, type ExceptionRow, type RecurringEntryRow } from "@/lib/schedule-engine";

function entry(o: Partial<RecurringEntryRow> = {}): RecurringEntryRow {
  return {
    id: "e1", course_id: "c1", doctor_id: "d1", day_of_week: 1,
    start_time: "09:00:00", end_time: "10:30:00", room: "A101", online_link: null,
    course: { id: "c1", code: "MBA501", name_en: "Strategic Management", name_ar: "الإدارة" },
    doctor: { id: "d1", full_name: "Dr. Ahmad" }, ...o,
  };
}

function exc(o: Partial<ExceptionRow> = {}): ExceptionRow {
  return {
    id: "x1", schedule_entry_id: "e1", course_id: "c1",
    exception_date: "2026-01-05", new_date: null, exception_type: "rescheduled",
    original_start_time: "09:00:00", original_end_time: "10:30:00",
    new_start_time: null, new_end_time: null, new_room: null,
    new_doctor_id: null, new_online_link: null,
    course: { id: "c1", code: "MBA501", name_en: "Strategic Management", name_ar: "الإدارة" },
    ...o,
  };
}

describe("computeActualSessions", () => {
  it("returns recurring sessions on a plain day", () => {
    const r = computeActualSessions("2026-01-05", [entry()], []);
    expect(r).toHaveLength(1);
    expect(r[0].status).toBe("confirmed");
  });

  it("removes a cancelled session", () => {
    const r = computeActualSessions("2026-01-05", [entry()], [exc({ exception_type: "cancelled" })]);
    expect(r).toHaveLength(0);
  });

  it("applies same-day time change", () => {
    const r = computeActualSessions("2026-01-05", [entry()], [
      exc({ new_start_time: "11:00:00", new_end_time: "12:30:00" }),
    ]);
    expect(r[0].start).toBe("11:00");
    expect(r[0].originalStart).toBe("09:00");
    expect(r[0].status).toBe("changed");
  });

  it("applies room change", () => {
    const r = computeActualSessions("2026-01-05", [entry()], [
      exc({ exception_type: "room_changed", new_room: "B202" }),
    ]);
    expect(r[0].room).toBe("B202");
    expect(r[0].originalRoom).toBe("A101");
  });

  it("hides a moved-away session on source date", () => {
    const r = computeActualSessions("2026-01-05", [entry()], [
      exc({ new_date: "2026-01-07", new_start_time: "09:00:00", new_end_time: "10:30:00" }),
    ]);
    expect(r).toHaveLength(0);
  });

  it("shows a moved-to session on target date", () => {
    const extra = new Map([["e1", entry()]]);
    const r = computeActualSessions("2026-01-07", [], [
      exc({ exception_date: "2026-01-05", new_date: "2026-01-07", new_start_time: "11:00:00", new_end_time: "12:30:00" }),
    ], extra);
    expect(r).toHaveLength(1);
    expect(r[0].start).toBe("11:00");
    expect(r[0].status).toBe("changed");
  });

  it("adds a replacement session", () => {
    const extra = new Map([["e1", entry()]]);
    const r = computeActualSessions("2026-01-07", [], [
      exc({ exception_date: "2026-01-07", exception_type: "replacement",
        new_start_time: "14:00:00", new_end_time: "15:30:00", new_room: "C303" }),
    ], extra);
    expect(r).toHaveLength(1);
    expect(r[0].status).toBe("replacement");
  });

  it("adds an additional session", () => {
    const extra = new Map([["e1", entry()]]);
    const r = computeActualSessions("2026-01-07", [], [
      exc({ exception_date: "2026-01-07", exception_type: "additional",
        new_start_time: "16:00:00", new_end_time: "17:00:00" }),
    ], extra);
    expect(r[0].status).toBe("additional");
  });

  it("sorts sessions by start time", () => {
    const r = computeActualSessions("2026-01-05", [
      entry({ id: "late", start_time: "14:00:00", end_time: "15:00:00" }),
      entry({ id: "early", start_time: "09:00:00", end_time: "10:00:00" }),
    ], []);
    expect(r.map((s) => s.id)).toEqual(["early", "late"]);
  });

  it("detects conflicts", () => {
    const r = computeActualSessions("2026-01-05", [
      entry({ id: "a", start_time: "09:00:00", end_time: "11:00:00" }),
      entry({ id: "b", start_time: "10:00:00", end_time: "12:00:00" }),
    ], []);
    expect(r[0].conflicts).toContain("b");
  });

  it("does not flag adjacent as conflict", () => {
    const r = computeActualSessions("2026-01-05", [
      entry({ id: "a", start_time: "09:00:00", end_time: "10:00:00" }),
      entry({ id: "b", start_time: "10:00:00", end_time: "11:00:00" }),
    ], []);
    expect(r[0].conflicts).toEqual([]);
  });

  it("handles multiple exceptions on the same entry", () => {
    const r = computeActualSessions("2026-01-05", [entry()], [
      exc({ id: "x1", new_start_time: "11:00:00", new_end_time: "12:30:00" }),
      exc({ id: "x2", exception_type: "room_changed", new_room: "B202" }),
    ]);
    expect(r[0].start).toBe("11:00");
    expect(r[0].room).toBe("B202");
  });

  it("ignores exceptions from other days", () => {
    const r = computeActualSessions("2026-01-12", [entry()], [
      exc({ exception_date: "2026-01-05", new_start_time: "11:00:00", new_end_time: "12:30:00" }),
    ]);
    expect(r[0].start).toBe("09:00");
  });
});
