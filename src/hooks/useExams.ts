import { useEffect, useState } from "react";

export interface ExamSubject {
  subject: string;
  start: string; // ISO string, e.g. "2026-06-03T09:00:00+08:00"
  end: string;
}

/**
 * Fetches a grade's exam schedule ONCE, then caches it in sessionStorage.
 * A page refresh reads from cache — no extra network call.
 * The schedule never contains links.
 */
export function useSchedule(grade: number) {
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [level, setLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grade) {
      setLoading(false);
      return;
    }

    const cacheKey = `schedule_grade_${grade}`;

    // 1. Refresh hits cache first — no network call.
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSubjects(parsed.subjects);
        setLevel(parsed.level ?? null);
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem(cacheKey); // corrupted -> refetch
      }
    }

    // 2. No cache -> fetch once, then store.
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/schedule?grade=${grade}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (cancelled) return;
        setSubjects(data.subjects);
        setLevel(data.level ?? null);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        if (!cancelled) setError("Failed to load schedule.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [grade]);

  return { subjects, level, loading, error };
}

/**
 * Called ONLY when a student clicks "Start" on an open exam.
 * The server re-checks the time and returns the link only if open.
 * Throws with a readable message otherwise (e.g. "Exam is not currently open").
 */
export async function getExamLink(
  grade: number,
  subject: string
): Promise<string> {
  const res = await fetch(
    `/api/exam-link?grade=${grade}&subject=${encodeURIComponent(subject)}`
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not get exam link");
  }
  const { link } = await res.json();
  return link as string;
}