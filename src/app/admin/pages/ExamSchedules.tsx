import { useEffect, useState } from "react";
import { Icon, icons } from "../icons";
import { useExamsData } from "../ExamsContext";
import {
  GRADES,
  cardCls,
  display,
  examStatus,
  fmtDate,
  fmtTime,
  inputCls,
  manilaParts,
  mono,
  statusStyle,
  toManilaIso,
  type Subject,
} from "../lib";
import { Alert, ConfirmDialog, ErrorCard, LoadingCard, SaveButton } from "../components/ui";

/* ── Time picker (12-hour) ─────────────────────────────────────────────── */
function TimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [h24, m] = value ? value.split(":").map(Number) : [8, 0];
  const isAM = h24 < 12;
  const h12 = h24 % 12 || 12;

  const commit = (newH12: number, newAM: boolean, newM: number) => {
    const h = newAM ? (newH12 === 12 ? 0 : newH12) : newH12 === 12 ? 12 : newH12 + 12;
    onChange(`${String(h).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  if (!minutes.includes(m)) minutes.push(m), minutes.sort((a, b) => a - b);
  const selCls =
    "bg-transparent text-sm font-medium text-[#0F172A] dark:text-white outline-none cursor-pointer pr-1 [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-[#0F172A] [&>option]:dark:text-white";

  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-center gap-1 h-10 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <select value={h12} onChange={(e) => commit(Number(e.target.value), isAM, m)} className={selCls} style={mono} aria-label={`${label} hour`}>
          {hours.map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
          ))}
        </select>
        <span className="text-slate-400 font-bold text-sm">:</span>
        <select value={m} onChange={(e) => commit(h12, isAM, Number(e.target.value))} className={selCls} style={mono} aria-label={`${label} minute`}>
          {minutes.map((min) => (
            <option key={min} value={min}>{String(min).padStart(2, "0")}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => commit(h12, !isAM, m)}
          className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors text-white"
          style={{ backgroundColor: isAM ? "#4F46E5" : "#0EA5E9" }}
        >
          {isAM ? "AM" : "PM"}
        </button>
      </div>
    </div>
  );
}

interface FormState {
  subject: string;
  link: string;
  date: string;
  endDate: string;
  multiDay: boolean;
  startTime: string;
  endTime: string;
  unscheduled: boolean;
}

const emptyForm: FormState = {
  subject: "",
  link: "",
  date: "",
  endDate: "",
  multiDay: false,
  startTime: "06:00",
  endTime: "12:00",
  unscheduled: false,
};

function formFromSubject(s: Subject): FormState {
  const a = manilaParts(s.start);
  const b = manilaParts(s.end);
  return {
    subject: s.subject,
    link: s.link || "",
    date: a.date,
    endDate: b.date,
    multiDay: !!a.date && !!b.date && a.date !== b.date,
    startTime: a.time || "06:00",
    endTime: b.time || "12:00",
    unscheduled: !s.start || !s.end,
  };
}

function subjectFromForm(f: FormState): Subject {
  if (f.unscheduled) return { subject: f.subject.trim(), link: f.link.trim() || null, start: null, end: null };
  return {
    subject: f.subject.trim(),
    link: f.link.trim() || null,
    start: toManilaIso(f.date, f.startTime),
    end: toManilaIso(f.multiDay ? f.endDate : f.date, f.endTime),
  };
}

type Editing = { mode: "add" } | { mode: "edit"; index: number; original: string; expected: Subject };

export default function ExamSchedules({ dark }: { dark: boolean }) {
  const { data, loading, error, reload, mutate } = useExamsData();
  const [activeGrade, setActiveGrade] = useState("Grade 7");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ index: number; name: string; expected: Subject } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (loading && !data) return <LoadingCard />;
  if (error && !data) return <ErrorCard message={error} onRetry={reload} />;

  const subjects = data?.grades?.[activeGrade]?.subjects || [];
  const rows = subjects.map((s, index) => ({ ...s, index, status: examStatus(s, now) }));

  const openAdd = () => {
    setForm({ ...emptyForm, date: manilaParts(new Date().toISOString()).date });
    setEditing({ mode: "add" });
    setFormError("");
  };
  const openEdit = (index: number) => {
    setForm(formFromSubject(subjects[index]));
    setEditing({ mode: "edit", index, original: subjects[index].subject, expected: subjects[index] });
    setFormError("");
  };
  const closeForm = () => {
    setEditing(null);
    setFormError("");
  };

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4000);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editing) return;
    setFormError("");
    if (!form.unscheduled && !form.date) return setFormError("Pick a date.");
    if (!form.unscheduled && form.multiDay && !form.endDate) return setFormError("Pick an end date.");
    const subject = subjectFromForm(form);
    if (subject.start && new Date(subject.end!) <= new Date(subject.start)) {
      return setFormError("End time must be after the start time.");
    }
    setSaving(true);
    try {
      if (editing.mode === "add") {
        await mutate({ op: "add", grade: activeGrade, subject });
        flash(`Added “${subject.subject}” to ${activeGrade}.`);
      } else {
        await mutate({ op: "update", grade: activeGrade, index: editing.index, original: editing.original, expected: editing.expected, subject });
        flash(`Updated “${subject.subject}”. Students will see the change within about a minute.`);
      }
      setEditing(null);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await mutate({ op: "delete", grade: activeGrade, index: deleteTarget.index, original: deleteTarget.name, expected: deleteTarget.expected });
      flash(`Removed “${deleteTarget.name}”.`);
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Grade tabs + actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-nowrap w-full sm:w-auto">
          {GRADES.map((g) => {
            const count = data?.grades?.[g]?.subjects?.length ?? 0;
            return (
              <button
                key={g}
                onClick={() => {
                  setActiveGrade(g);
                  closeForm();
                }}
                className={`h-9 px-3.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  activeGrade === g
                    ? "bg-[#4F46E5] text-white shadow-sm"
                    : "bg-white dark:bg-[#161B22] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-[#4F46E5]/50 hover:text-[#4F46E5]"
                }`}
              >
                {g.replace("Grade ", "G")}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeGrade === g ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reload}
            disabled={loading}
            title="Reload from Firebase"
            className="h-9 w-9 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-[#4F46E5] hover:border-[#4F46E5]/50 transition-colors disabled:opacity-50"
          >
            <Icon def={icons.refresh} size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openAdd}
            className="h-9 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <Icon def={icons.plus} size={14} className="text-white" />
            Schedule Exam
          </button>
        </div>
      </div>

      {notice && <Alert kind="success">{notice}</Alert>}

      {/* Add / edit form */}
      {editing && (
        <div className={`${cardCls} p-5`}>
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-4" style={display}>
            {editing.mode === "add" ? `New Exam · ${activeGrade}` : `Edit Exam · ${activeGrade}`}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Mathematics"
                className={inputCls}
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.unscheduled}
                onChange={(e) => setForm((f) => ({ ...f, unscheduled: e.target.checked }))}
                className="accent-[#4F46E5]"
              />
              No schedule yet (hidden from students)
            </label>

            {!form.unscheduled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{form.multiDay ? "Start Date" : "Date"}</label>
                    <input
                      required
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  {form.multiDay && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                      <input
                        required
                        type="date"
                        value={form.endDate}
                        min={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.multiDay}
                    onChange={(e) => setForm((f) => ({ ...f, multiDay: e.target.checked, endDate: f.endDate || f.date }))}
                    className="accent-[#4F46E5]"
                  />
                  Ends on a different day
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <TimePicker label="Start Time" value={form.startTime} onChange={(v) => setForm((f) => ({ ...f, startTime: v }))} />
                  <TimePicker label="End Time" value={form.endTime} onChange={(v) => setForm((f) => ({ ...f, endTime: v }))} />
                </div>
                <p className="text-[10px] text-slate-400">Times are Philippine time (UTC+8).</p>
              </>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Exam Link <span className="text-slate-400 normal-case font-normal">(only shown to students while the exam is open)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon def={icons.link} size={13} className="text-slate-400" />
                </span>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="https://forms.office.com/…"
                  className={`${inputCls} pl-9`}
                  style={{ ...mono, fontSize: "12px" }}
                />
              </div>
            </div>

            {formError && <Alert kind="error">{formError}</Alert>}

            <div className="flex gap-3 pt-1">
              <SaveButton type="submit" saving={saving} small label={editing.mode === "add" ? "Add to Schedule" : "Save Changes"} />
              <button type="button" onClick={closeForm} className="h-9 px-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[#0F172A] dark:text-white" style={display}>{activeGrade}</span>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs text-slate-400">
          {rows.length} exam{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {["Exam", "Date", "Start", "End", "Link", "Status", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${h === "Link" ? "hidden md:table-cell" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((exam) => {
                const sc = statusStyle[exam.status];
                const isEditingRow = editing?.mode === "edit" && editing.index === exam.index;
                return (
                  <tr
                    key={`${exam.index}-${exam.subject}`}
                    className={`border-b border-slate-50 dark:border-slate-800/60 last:border-0 transition-colors ${
                      isEditingRow ? "bg-[#4F46E5]/5" : "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-medium text-[#0F172A] dark:text-white leading-tight">{exam.subject}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(exam.start)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-[#0F172A] dark:text-white whitespace-nowrap" style={mono}>{fmtTime(exam.start)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-[#0F172A] dark:text-white whitespace-nowrap" style={mono}>
                        {fmtTime(exam.end)}
                        {exam.start && exam.end && manilaParts(exam.start).date !== manilaParts(exam.end).date && (
                          <span className="block text-[10px] text-slate-400">{fmtDate(exam.end)}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {exam.link ? (
                        <a
                          href={exam.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-[#4F46E5] hover:text-[#4338CA] bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Icon def={icons.link} size={11} />
                          Open
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ color: dark ? sc.darkText : sc.text, backgroundColor: dark ? sc.darkBg : sc.bg }}
                      >
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(exam.index)}
                          title="Edit"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#4F46E5] hover:bg-[#4F46E5]/10 transition-colors"
                        >
                          <Icon def={icons.edit} size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError("");
                            setDeleteTarget({ index: exam.index, name: exam.subject, expected: subjects[exam.index] });
                          }}
                          title="Delete"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Icon def={icons.trash} size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="py-16 text-center">
            <Icon def={icons.examSchedules} size={32} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No exams scheduled for {activeGrade} yet.</p>
            <button onClick={openAdd} className="mt-3 text-xs text-[#4F46E5] hover:underline">
              Schedule one now →
            </button>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete exam?"
          message={
            <>
              “{deleteTarget.name}” will be removed from {activeGrade}. Students will no longer see it.
            </>
          }
          confirmLabel="Delete"
          busy={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
