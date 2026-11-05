import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../api/firebase-client";

export const SCHOOL_NAME = "TNHSA ExamiSafe";
export const SETTINGS_COLLECTION = "TNHSAExamiSafe";
export const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

// ── Admin API (server routes in /api/admin.js) ───────────────────────────────
export async function adminApi<T = any>(resource: string, payload?: object): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  const res = await fetch(`/api/admin?r=${resource}`, {
    method: payload ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!(res.headers.get("content-type") || "").includes("application/json")) {
    throw new Error("The admin API isn't reachable. Make sure the latest version is deployed to Vercel.");
  }
  const data = await res.json();
  if (res.status === 401) {
    // Session revoked (e.g. force-logged-out by another admin).
    await signOut(auth);
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

// ── Settings docs in the TNHSAExamiSafe collection ───────────────────────────
export async function loadSetting<T>(name: string, fallback: T): Promise<T> {
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, name));
  return snap.exists() ? ({ ...fallback, ...(snap.data() as T) }) : fallback;
}

export async function saveSetting(name: string, data: object) {
  await setDoc(doc(db, SETTINGS_COLLECTION, name), data);
}

// ── Exams ────────────────────────────────────────────────────────────────────
export interface Subject {
  subject: string;
  link: string | null;
  start: string | null; // "2026-09-07T06:00:00+08:00"
  end: string | null;
}

export interface ExamsDoc {
  grades: Record<string, { level?: string; subjects: Subject[] }>;
  updatedAt?: string;
}

export type ExamStatus = "Ongoing" | "Upcoming" | "Completed" | "Not scheduled";

export function examStatus(s: Subject, now = Date.now()): ExamStatus {
  if (!s.start || !s.end) return "Not scheduled";
  const start = new Date(s.start).getTime();
  const end = new Date(s.end).getTime();
  if (now < start) return "Upcoming";
  if (now > end) return "Completed";
  return "Ongoing";
}

export const statusStyle: Record<ExamStatus, { text: string; bg: string; darkText: string; darkBg: string }> = {
  Ongoing: { text: "#059669", bg: "#ECFDF5", darkText: "#34d399", darkBg: "#064e3b" },
  Upcoming: { text: "#D97706", bg: "#FFFBEB", darkText: "#fbbf24", darkBg: "#451a03" },
  Completed: { text: "#64748B", bg: "#F1F5F9", darkText: "#94a3b8", darkBg: "#1e293b" },
  "Not scheduled": { text: "#94A3B8", bg: "#F8FAFC", darkText: "#64748b", darkBg: "#0f172a" },
};

const TZ = "Asia/Manila";

/** Split an ISO timestamp into Manila-local { date: "YYYY-MM-DD", time: "HH:mm" }. */
export function manilaParts(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Build the stored format from Manila-local date + time. */
export function toManilaIso(date: string, time: string): string {
  return `${date}T${time}:00+08:00`;
}

export function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
}

export function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" });
}

export function initials(name: string) {
  return (
    name
      .replace(/^(mr|mrs|ms|dr)\.?\s+/i, "")
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((n) => n[0]!.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  );
}

export function timeAgo(ms: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 45) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} hr ago`;
}

export const inputCls =
  "w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-[#0F172A] dark:text-white placeholder-slate-400 outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all";

export const labelCls = "block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

export const cardCls = "bg-white dark:bg-[#161B22] rounded-xl border border-slate-100 dark:border-slate-800";

export const display = { fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif" };
export const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
