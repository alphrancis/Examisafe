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

    // Serve from sessionStorage if already loaded this session
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSubjects(parsed.subjects);
        setLevel(parsed.level);
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    // Fetch from Vercel-cached endpoint
    fetch("/api/schedule-all")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        const gradeData = (data.grades || {})[`Grade ${grade}`];
        const subjects: ExamSubject[] = (gradeData?.subjects || [])
          .filter((s: ExamSubject) => s.start != null && s.end != null)
          .map((s: ExamSubject) => ({
            subject: s.subject,
            start: s.start,
            end: s.end,
          }));
        const level: string | null = gradeData?.level ?? null;
        setSubjects(subjects);
        setLevel(level);
        sessionStorage.setItem(cacheKey, JSON.stringify({ subjects, level }));
      })
      .catch(() => setError("Database Error"))
      .finally(() => setLoading(false));
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