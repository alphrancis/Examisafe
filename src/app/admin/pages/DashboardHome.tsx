import { useEffect, useMemo, useState } from "react";
import { Icon, icons } from "../icons";
import { useExamsData } from "../ExamsContext";
import { GRADES, cardCls, display, examStatus, fmtDate, fmtTime, mono, statusStyle, type ExamStatus } from "../lib";
import { ErrorCard, LoadingCard } from "../components/ui";

export default function DashboardHome({ dark, onOpenSchedules }: { dark: boolean; onOpenSchedules: () => void }) {
  const { data, loading, error, reload } = useExamsData();
  const [now, setNow] = useState(Date.now());

  // Re-evaluate statuses every 30s so "Ongoing"/"Completed" flip on time.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { totals, perGrade, upcoming } = useMemo(() => {
    const totals: Record<ExamStatus | "Total", number> = { Total: 0, Ongoing: 0, Upcoming: 0, Completed: 0, "Not scheduled": 0 };
    const perGrade = GRADES.map((grade) => {
      const row: Record<ExamStatus | "Total", number> = { Total: 0, Ongoing: 0, Upcoming: 0, Completed: 0, "Not scheduled": 0 };
      for (const s of data?.grades?.[grade]?.subjects || []) {
        const st = examStatus(s, now);
        row[st]++;
        row.Total++;
        totals[st]++;
        totals.Total++;
      }
      return { grade, ...row };
    });
    const upcoming = GRADES.flatMap((grade) =>
      (data?.grades?.[grade]?.subjects || []).map((s) => ({ ...s, grade, status: examStatus(s, now) }))
    )
      .filter((s) => s.status === "Ongoing" || s.status === "Upcoming")
      .sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime())
      .slice(0, 8);
    return { totals, perGrade, upcoming };
  }, [data, now]);

  if (loading && !data) return <LoadingCard />;
  if (error && !data) return <ErrorCard message={error} onRetry={reload} />;

  const stats = [
    { label: "Total Exams", value: totals.Total, icon: icons.examSchedules, color: "#4F46E5", bg: "#EEF2FF", darkBg: "#1e1b4b" },
    { label: "Ongoing Now", value: totals.Ongoing, icon: icons.pulse, color: "#10B981", bg: "#ECFDF5", darkBg: "#064e3b" },
    { label: "Upcoming", value: totals.Upcoming, icon: icons.bell, color: "#F59E0B", bg: "#FFFBEB", darkBg: "#451a03" },
    { label: "Completed", value: totals.Completed, icon: icons.check, color: "#0EA5E9", bg: "#F0F9FF", darkBg: "#082f49" },
  ];

  const updated = data?.updatedAt ? `${fmtDate(data.updatedAt)} · ${fmtTime(data.updatedAt)}` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] text-slate-400" style={mono}>
          {updated ? `Schedule last updated ${updated}` : ""}
        </span>
        <button
          onClick={reload}
          disabled={loading}
          className="h-8 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:text-[#4F46E5] hover:border-[#4F46E5]/50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Icon def={icons.refresh} size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`${cardCls} p-5 hover:shadow-sm transition-shadow`}>
            <div className="mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: dark ? s.darkBg : s.bg }}>
                <span style={{ color: s.color }}>
                  <Icon def={s.icon} size={18} />
                </span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-0.5" style={{ ...display, color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0F172A] dark:text-white" style={display}>
            Exams by Grade Level
          </h2>
          {totals["Not scheduled"] > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" style={mono}>
              {totals["Not scheduled"]} still without a schedule
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                {["Grade Level", "Total", "Ongoing", "Upcoming", "Completed", "No Schedule"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perGrade.map((row) => (
                <tr key={row.grade} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#4F46E5]/60 dark:bg-[#4F46E5]/80" />
                      <span className="text-sm font-medium text-[#0F172A] dark:text-white whitespace-nowrap">{row.grade}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold text-[#4F46E5]" style={display}>
                      {row.Total}
                    </span>
                  </td>
                  <Count value={row.Ongoing} cls="text-emerald-600 dark:text-emerald-400" dot="bg-emerald-400" />
                  <Count value={row.Upcoming} cls="text-amber-600 dark:text-amber-400" dot="bg-amber-400" />
                  <Count value={row.Completed} cls="text-sky-600 dark:text-sky-400" dot="bg-sky-400" />
                  <td className="px-5 py-3.5">
                    {row["Not scheduled"] > 0 ? (
                      <button
                        onClick={onOpenSchedules}
                        title="Open Exam Schedules to set these"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap"
                      >
                        <Icon def={icons.warning} size={11} />
                        {row["Not scheduled"]}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <Icon def={icons.check} size={12} className="text-emerald-500" />0
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0F172A] dark:text-white" style={display}>
            Ongoing & Upcoming Exams
          </h2>
          <button onClick={onOpenSchedules} className="text-xs text-[#4F46E5] hover:underline">
            Manage schedules →
          </button>
        </div>
        {upcoming.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No ongoing or upcoming exams.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  {["Exam", "Grade", "Start", "End", "Status"].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${h === "Grade" ? "hidden sm:table-cell" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcoming.map((exam) => {
                  const sc = statusStyle[exam.status];
                  return (
                    <tr key={`${exam.grade}-${exam.subject}`} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-[#0F172A] dark:text-white leading-tight">{exam.subject}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {fmtDate(exam.start)}
                          <span className="sm:hidden"> · {exam.grade}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 text-[#4F46E5] font-medium whitespace-nowrap">{exam.grade}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap" style={mono}>{fmtTime(exam.start)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap" style={mono}>{fmtTime(exam.end)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ color: dark ? sc.darkText : sc.text, backgroundColor: dark ? sc.darkBg : sc.bg }}
                        >
                          {exam.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Count({ value, cls, dot }: { value: number; cls: string; dot: string }) {
  return (
    <td className="px-5 py-3.5">
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {value}
      </span>
    </td>
  );
}
