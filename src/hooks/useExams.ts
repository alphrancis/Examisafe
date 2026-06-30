import { useEffect, useState, useCallback } from "react";
import { doc, getDocFromServer } from "firebase/firestore";
import { db } from "../../api/firebase-client";

export interface ExamSubject {
  subject: string;
  start: string;
  end: string;
}

interface CachedSchedule {
  subjects: ExamSubject[];
  level: string | null;
  updatedAt: string;
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
    let cachedData: CachedSchedule | null = null;

    // Step 1: Check sessionStorage cache
    if (!force) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed: CachedSchedule = JSON.parse(cached);
          cachedData = parsed;
          console.log("Cache found, updatedAt:", parsed.updatedAt);
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }

    // Step 2: Force read updatedAt from Firestore SERVER
    let serverUpdatedAt: string | null = null;
    try {
      const versionSnap = await getDocFromServer(doc(db, "exams", "all"));
      if (versionSnap.exists()) {
        serverUpdatedAt = versionSnap.data().updatedAt as string;
        console.log("Server updatedAt:", serverUpdatedAt);
      }
    } catch (err) {
      console.error("Firestore server read failed:", err);
      if (cachedData) {
        setSubjects(cachedData.subjects);
        setLevel(cachedData.level);
        setLoading(false);
        return;
      }
    }

    // Step 3: Compare — if same, use cache
    if (cachedData && serverUpdatedAt && cachedData.updatedAt === serverUpdatedAt) {
      console.log("Cache is fresh, using it");
      setSubjects(cachedData.subjects);
      setLevel(cachedData.level);
      setLoading(false);
      return;
    }

    console.log("Cache stale or missing, fetching from API...");

    // Step 4: Fetch fresh from API with cache-buster
    try {
      const res = await fetch(`/api/schedule?grade=${grade}&_cb=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();

      const subjects = (data.subjects as ExamSubject[] || []).filter(
        (s: ExamSubject) => s.start != null && s.end != null
      );

      setSubjects(subjects);
      setLevel((data.level as string | null) ?? null);

      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          subjects,
          level: data.level ?? null,
          updatedAt: serverUpdatedAt || new Date().toISOString(),
        })
      );
      console.log("New data cached");
    } catch (err) {
      console.error("API fetch failed:", err);
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

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const refresh = useCallback(() => {
    sessionStorage.removeItem(`schedule_grade_${grade}`);
    return fetchSchedule(true);
  }, [fetchSchedule, grade]);

  return { subjects, level, loading, error, refresh };
}

export async function getExamLink(grade: number, subject: string): Promise<string> {
  const res = await fetch(
    `/api/schedule?grade=${grade}&subject=${encodeURIComponent(subject)}`
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not get exam link");
  }
  const { link } = await res.json();
  return link as string;
}