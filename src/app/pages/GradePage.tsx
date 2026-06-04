import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  ArrowLeft, Calculator, Microscope, BookOpen,
  Globe, Laptop, Atom, FlaskConical,
  Feather, Landmark, BookText, Info, CalendarOff,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useSchedule, getExamLink, type ExamSubject } from "../../hooks/useExams";

const getSubjectIcon = (subject: string) => {
  const lower = subject.toLowerCase();
  if (lower.includes("math")) return <Calculator className="w-5 h-5" />;
  if (lower.includes("science")) return <Microscope className="w-5 h-5" />;
  if (lower.includes("physics")) return <Atom className="w-5 h-5" />;
  if (lower.includes("chemistry")) return <FlaskConical className="w-5 h-5" />;
  if (lower.includes("ict") || lower.includes("technology") || lower.includes("css"))
    return <Laptop className="w-5 h-5" />;
  if (lower.includes("araling") || lower.includes("social")) return <Globe className="w-5 h-5" />;
  if (lower.includes("humanities") || lower.includes("hope")) return <Landmark className="w-5 h-5" />;
  if (lower.includes("literature") || lower.includes("writing")) return <Feather className="w-5 h-5" />;
  if (lower.includes("filipino") || lower.includes("english")) return <BookText className="w-5 h-5" />;
  return <BookOpen className="w-5 h-5" />;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function statusOf(s: ExamSubject, now: Date): "upcoming" | "open" | "closed" {
  const start = new Date(s.start);
  const end = new Date(s.end);
  if (now < start) return "upcoming";
  if (now > end) return "closed";
  return "open";
}

export default function GradePage() {
  const navigate = useNavigate();
  const { gradeLevel } = useParams();
  const grade = parseInt(gradeLevel || "0");

  const { subjects, loading, error } = useSchedule(grade);
  const isJuniorHigh = grade >= 7 && grade <= 10;

  // Ticking clock flips button states without any fetching.
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [busy, setBusy] = useState<string | null>(null);

  const handleStart = async (subject: string) => {
    setBusy(subject);
    try {
      const link = await getExamLink(grade, subject);
      window.open(link, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 flex-grow max-w-5xl">
        <div className="mb-8">
          <button
            onClick={() => navigate(isJuniorHigh ? "/junior-high" : "/senior-high")}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to {isJuniorHigh ? "Junior High" : "Senior High"}
          </button>
        </div>

        <div className="mb-10">
          <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-3">
            Grade {grade} Examinations
          </h2>
          <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
            Select a subject below to begin your scheduled examination. Ensure you are
            in a quiet environment before proceeding.
          </p>
        </div>

        {loading && (
          <p className="text-center text-slate-500 py-20">Loading examinations…</p>
        )}

        {error && (
          <p className="text-center text-red-500 py-20">{error}</p>
        )}

        {/* EMPTY STATE — "No exams today" */}
        {!loading && !error && subjects.length === 0 && (
          <div className="text-center py-24">
            <div className="mx-auto mb-5 w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <CalendarOff className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-xl font-semibold text-slate-700">No exams today</p>
            <p className="text-slate-500 mt-2">
              There are no scheduled examinations for Grade {grade} right now.
            </p>
          </div>
        )}

        {!loading && !error && subjects.length > 0 && (
          <>
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm mb-10">
              <div className="flex items-center gap-2 mb-3 text-slate-800">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm tracking-wide">Before you begin</h3>
              </div>
              <ul className="grid sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-slate-600">
                <li className="flex items-start gap-2"><span className="text-slate-300 mt-0.5">•</span>Ensure a stable internet connection.</li>
                <li className="flex items-start gap-2"><span className="text-slate-300 mt-0.5">•</span>Exams unlock only during their scheduled window.</li>
                <li className="flex items-start gap-2"><span className="text-slate-300 mt-0.5">•</span>Pace yourself; time limits are strictly enforced.</li>
                <li className="flex items-start gap-2"><span className="text-slate-300 mt-0.5">•</span>Examinations cannot be paused once initiated.</li>
              </ul>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {subjects.map((s) => {
                const status = statusOf(s, now);
                return (
                  <motion.div key={s.subject} variants={itemVariants} className="will-change-transform">
                    <Card className="h-full border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 bg-white group">
                      <CardContent className="p-6 flex flex-col h-full relative overflow-hidden">
                        <div className="flex items-start mb-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-all duration-300">
                            {getSubjectIcon(s.subject)}
                          </div>
                        </div>
                        <div className="mb-5 flex-grow">
                          <h3 className="text-lg font-bold text-slate-900 mb-1">{s.subject}</h3>
                          <p className="text-sm text-slate-500 font-medium">
                            {fmt(s.start)} – {fmt(s.end)}
                          </p>
                        </div>

                        {status === "open" && (
                          <Button
                            onClick={() => handleStart(s.subject)}
                            disabled={busy === s.subject}
                            className="w-full bg-slate-900 hover:bg-blue-600 text-white shadow-none rounded-lg font-semibold transition-colors duration-300"
                          >
                            {busy === s.subject ? "Opening…" : "Start Examination"}
                          </Button>
                        )}
                        {status === "upcoming" && (
                          <Button disabled className="w-full rounded-lg font-semibold" variant="outline">
                            Not yet available
                          </Button>
                        )}
                        {status === "closed" && (
                          <Button disabled className="w-full rounded-lg font-semibold" variant="outline">
                            Closed
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}