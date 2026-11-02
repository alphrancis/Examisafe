import { useEffect, useState } from "react";

export interface ExamSubject {
  subject: string;
  start: string;
  end: string;
}

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

    let cancelled = false;

    // Hits the CDN-cached endpoint (not Firestore), so polling is cheap.
    const load = () =>
      fetch("/api/schedule-all")
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load");
          return r.json();
        })
        .then((data) => {
          if (cancelled) return;
          const gradeData = (data.grades || {})[`Grade ${grade}`];
          const subjects: ExamSubject[] = (gradeData?.subjects || [])
            .filter((s: ExamSubject) => s.start != null && s.end != null)
            .map((s: ExamSubject) => ({
              subject: s.subject,
              start: s.start,
              end: s.end,
            }));
          setSubjects(subjects);
          setLevel(gradeData?.level ?? null);
          setError(null);
        })
        .catch(() => {
          if (!cancelled) setError("Database Error");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    load();

    // Re-check so teacher edits (e.g. changed exam time) reach open tabs.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [grade]);

  return { subjects, level, loading, error };
}

export async function getExamLink(grade: number, subject: string): Promise<string> {
    const res = await fetch(
      `/api/exam-link?grade=${grade}&subject=${encodeURIComponent(subject)}`
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not get exam link");
    }
    return data.link;
}