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

    const cacheKey = `schedule_grade_${grade}`;


    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);

        const subjects = (parsed.subjects as ExamSubject[]).filter(
          (s) => s.start != null && s.end != null
        );
        setSubjects(subjects);
        setLevel(parsed.level ?? null);
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/schedule?grade=${grade}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (cancelled) return;

        const subjects = (data.subjects as ExamSubject[]).filter(
          (s) => s.start != null && s.end != null
        );

        setSubjects(subjects);
        setLevel(data.level ?? null);

        sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, subjects }));
      } catch {
        if (!cancelled) setError("Database Error");
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