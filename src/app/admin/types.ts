export type Page =
  | "dashboard"
  | "app-update"
  | "completion"
  | "passwords"
  | "webconfig"
  | "add-users"
  | "exam-schedules"
  | "who-online"
  | "profile"
  | "activity-log";

export const PAGES: Page[] = [
  "dashboard",
  "app-update",
  "completion",
  "passwords",
  "webconfig",
  "add-users",
  "exam-schedules",
  "who-online",
  "profile",
  "activity-log",
];

export type Role = "super_admin" | "teacher";

export const ROLE_LABEL: Record<Role, string> = { super_admin: "Admin", teacher: "Teacher" };

/** Pages a teacher may open. Admins can open every page. */
export const TEACHER_PAGES: Page[] = ["dashboard", "exam-schedules", "passwords", "who-online", "profile"];

export const canOpen = (role: Role | null, page: Page) => role === "super_admin" || TEACHER_PAGES.includes(page);
