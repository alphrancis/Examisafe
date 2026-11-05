import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { adminApi, type ExamsDoc, type Subject } from "./lib";

type ExamOp =
  | { op: "add"; grade: string; subject: Subject }
  | { op: "update"; grade: string; index: number; original: string; expected: Subject; subject: Subject }
  | { op: "delete"; grade: string; index: number; original: string; expected: Subject };

interface ExamsCtx {
  data: ExamsDoc | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  mutate: (op: ExamOp) => Promise<void>;
}

const Ctx = createContext<ExamsCtx | undefined>(undefined);

// Loads exams/all once for the whole dashboard (1 Firestore read) and shares it
// between the Dashboard and Exam Schedules pages.
export function ExamsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ExamsDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi<ExamsDoc>("exams"));
    } catch (e: any) {
      setError(e.message || "Could not load exams");
    } finally {
      setLoading(false);
    }
  }, []);

  const mutate = useCallback(async (op: ExamOp) => {
    try {
      // The server already retries contended saves; if it is still busy (many
      // teachers saving at once), wait a moment and try again a few times.
      for (let attempt = 0; ; attempt++) {
        try {
          setData(await adminApi<ExamsDoc>("exams", op));
          return;
        } catch (e: any) {
          if (attempt >= 3 || !/saving at once/i.test(e.message)) throw e;
          await new Promise((r) => setTimeout(r, 400 * 2 ** attempt + Math.random() * 400));
        }
      }
    } catch (e: any) {
      // Keep the view in sync if someone else changed the data.
      if (/someone else/i.test(e.message)) reload();
      throw e;
    }
  }, [reload]);

  useEffect(() => {
    reload();
  }, [reload]);

  return <Ctx.Provider value={{ data, loading, error, reload, mutate }}>{children}</Ctx.Provider>;
}

export function useExamsData() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useExamsData must be used inside ExamsProvider");
  return c;
}
