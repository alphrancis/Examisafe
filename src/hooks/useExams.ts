import { useEffect, useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../api/firebase-client";

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

  const fetchSchedule = useCallback(async (force = false) => {
    if (!grade) {
      setLoading(false);
      return;
    }

    const cacheKey = `schedule_grade_${grade}`;

    // Step 1: Check cache
    let cachedData: { subjects: ExamSubject[]; level: string | null; updatedAt: string } | null = null;
    
    if (!force) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          cachedData = JSON.parse(cached);
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }

    // Step 2: Check updatedAt from Firestore (1 read, lightweight)
    let serverUpdatedAt: string | null = null;
    try {
      const versionSnap = await getDoc(doc(db, "exams", "all"));
      if (versionSnap.exists()) {
        serverUpdatedAt = versionSnap.data().updatedAt as string;
      }
    } catch {
      // If Firestore fails, fall back to cached data if available
      if (cachedData) {
        setSubjects(cachedData.subjects);
        setLevel(cachedData.level);
        setLoading(false);
        return;
      }
    }

    // Step 3: Compare and decide
    if (cachedData && serverUpdatedAt && cachedData.updatedAt === serverUpdatedAt) {
      // Cache is fresh — use it
      setSubjects(cachedData.subjects);
      setLevel(cachedData.level);
      setLoading(false);
      return;
    }

    // Step 4: Fetch fresh from API
    try {
      const res = await fetch(`/api/schedule?grade=${grade}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();

      const subjects = (data.subjects as ExamSubject[]).filter(
        (s) => s.start != null && s.end != null
      );

      setSubjects(subjects);
      setLevel(data.level ?? null);

      // Save to cache with updatedAt
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          subjects,
          level: data.level ?? null,
          updatedAt: serverUpdatedAt ?? new Date().toISOString(),
        })
      );
    } catch {
      // If API fails but we have cache, use it as fallback
      if (cachedData) {
        setSubjects(cachedData.subjects);
        setLevel(cachedData.level);
      } else {
        setError("Database Error");
      }
    } finally {
      setLoading(false);
    }
  }, [grade]);

  // Initial load
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Manual refresh
  const refresh = useCallback(() => {
    sessionStorage.removeItem(`schedule_grade_${grade}`);
    return fetchSchedule(true);
  }, [fetchSchedule, grade]);

  return { subjects, level, loading, error, refresh };
}

export async function getExamLink(grade: number, subject: string): Promise<string> {
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