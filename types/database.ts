export type UserRole = "admin" | "doctor" | "representative" | "student";
export type SemesterStatus = "upcoming" | "active" | "archived";
export type ChangeRequestStatus =
  | "pending_doctor" | "pending_approval" | "approved"
  | "published" | "rejected" | "cancelled";
export type ExceptionType =
  | "rescheduled" | "cancelled" | "room_changed"
  | "doctor_changed" | "replacement" | "additional";
export type AnnouncementCategory =
  | "official" | "doctor" | "representative"
  | "majles_tolab" | "urgent" | "course";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  full_name_ar: string | null;
  role: UserRole;
  program_id: string | null;
  student_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface ActualSession {
  id: string;
  courseId: string;
  doctorId: string;
  courseNameEn?: string;
  courseNameAr?: string;
  room: string | null;
  onlineLink: string | null;
  start: string;
  end: string;
  status: "confirmed" | "changed" | "cancelled" | "replacement" | "additional";
  originalStart?: string | null;
  originalEnd?: string | null;
}
