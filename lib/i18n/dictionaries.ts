export type Locale = "en" | "ar";

export const dictionaries = {
  en: {
    nav: {
      dashboard: "Dashboard", courses: "Courses", mainSchedule: "Main Schedule",
      today: "Today", tomorrow: "Tomorrow", calendar: "Calendar",
      announcements: "Announcements", notifications: "Notifications",
      profile: "Profile", users: "Users", semesters: "Semesters",
      approvals: "Approvals", changeRequests: "Change Requests",
      myCourses: "My Courses", auditLogs: "Audit Logs", settings: "Settings",
      signOut: "Sign out",
    },
    common: {
      loading: "Loading…", saving: "Saving…", save: "Save", cancel: "Cancel",
      delete: "Delete", edit: "Edit", create: "Create", open: "Open", back: "Back",
      viewAll: "View all", today: "Today", tomorrow: "Tomorrow", search: "Search",
      noData: "Nothing to show", requiredAck: "Acknowledgment required",
      urgent: "Urgent", pinned: "Pinned", unread: "Unread",
    },
    dashboard: {
      welcome: "Welcome", todaySchedule: "Today's schedule",
      tomorrowSchedule: "Tomorrow's schedule", latestAnnouncements: "Latest announcements",
      upcomingExams: "Upcoming exams & deadlines", scheduleChanges: "Recent schedule changes",
      quickLinks: "Quick links", pendingConfirmations: "Pending confirmations",
      pendingApprovals: "Pending approvals", assignedCourses: "Assigned courses",
      classAnnouncements: "Class announcements",
      acknowledgmentOverview: "Acknowledgment overview", recentActivity: "Recent activity",
    },
    schedule: {
      main: "Main semester schedule", today: "Today", tomorrow: "Tomorrow",
      week: "Week schedule", month: "Month", date: "Schedule for", changes: "Schedule changes",
      noSessions: "No sessions", confirmed: "Confirmed", changed: "Changed",
      replacement: "Replacement", additional: "Additional", conflict: "Conflict",
    },
    calendar: {
      title: "Academic calendar", month: "Month", week: "Week", day: "Day",
      agenda: "Agenda", newEvent: "New event",
      categories: {
        lecture: "Lecture", exam: "Exam", quiz: "Quiz", assignment: "Assignment",
        holiday: "Holiday", closure: "University closure", schedule_change: "Schedule change",
        council: "Student council", registration: "Registration", other: "Other",
      },
    },
  },
  ar: {
    nav: {
      dashboard: "لوحة التحكم", courses: "المقررات", mainSchedule: "الجدول الرئيسي",
      today: "اليوم", tomorrow: "غداً", calendar: "التقويم",
      announcements: "الإعلانات", notifications: "الإشعارات",
      profile: "الملف الشخصي", users: "المستخدمون", semesters: "الفصول",
      approvals: "الموافقات", changeRequests: "طلبات التغيير",
      myCourses: "مقرراتي", auditLogs: "سجلات النشاط", settings: "الإعدادات",
      signOut: "تسجيل الخروج",
    },
    common: {
      loading: "جارٍ التحميل…", saving: "جارٍ الحفظ…", save: "حفظ", cancel: "إلغاء",
      delete: "حذف", edit: "تعديل", create: "إنشاء", open: "فتح", back: "رجوع",
      viewAll: "عرض الكل", today: "اليوم", tomorrow: "غداً", search: "بحث",
      noData: "لا يوجد ما يُعرض", requiredAck: "يتطلب إقراراً",
      urgent: "عاجل", pinned: "مثبّت", unread: "غير مقروء",
    },
    dashboard: {
      welcome: "مرحباً", todaySchedule: "جدول اليوم", tomorrowSchedule: "جدول الغد",
      latestAnnouncements: "أحدث الإعلانات", upcomingExams: "الامتحانات والمواعيد القادمة",
      scheduleChanges: "تغييرات الجدول الأخيرة", quickLinks: "روابط سريعة",
      pendingConfirmations: "بانتظار التأكيد", pendingApprovals: "بانتظار الموافقة",
      assignedCourses: "المقررات المُسندة", classAnnouncements: "إعلانات الصف",
      acknowledgmentOverview: "نظرة عامة على الإقرارات", recentActivity: "النشاط الأخير",
    },
    schedule: {
      main: "الجدول الرئيسي للفصل", today: "اليوم", tomorrow: "غداً",
      week: "جدول الأسبوع", month: "الشهر", date: "جدول يوم", changes: "تغييرات الجدول",
      noSessions: "لا توجد حصص", confirmed: "مؤكد", changed: "مُعدّل",
      replacement: "بديل", additional: "إضافي", conflict: "تعارض",
    },
    calendar: {
      title: "التقويم الأكاديمي", month: "شهر", week: "أسبوع", day: "يوم",
      agenda: "أجندة", newEvent: "حدث جديد",
      categories: {
        lecture: "محاضرة", exam: "امتحان", quiz: "اختبار قصير", assignment: "تسليم واجب",
        holiday: "عطلة", closure: "إغلاق الجامعة", schedule_change: "تغيير جدول",
        council: "مجلس الطلاب", registration: "تسجيل", other: "أخرى",
      },
    },
  },
} as const;
