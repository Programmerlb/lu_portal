export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Asia/Beirut";

export const ROLE_HOME = {
  admin: "/dashboard",
  doctor: "/dashboard",
  representative: "/dashboard",
  student: "/dashboard",
} as const;

export type Role = keyof typeof ROLE_HOME;

export const ROLE_LABEL: Record<Role, { en: string; ar: string }> = {
  admin: { en: "Administrator", ar: "إدارة المنصة" },
  doctor: { en: "Doctor", ar: "الدكتور" },
  representative: { en: "Class Representative", ar: "المندوب" },
  student: { en: "Student", ar: "الطالب" },
};
