import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon, icons } from "../icons";
import { adminApi, cardCls, fmtDate, fmtTime, mono, timeAgo, type Subject } from "../lib";
import { Avatar, ErrorCard, LoadingCard, RoleBadge, Spinner } from "../components/ui";

interface Person {
  email: string;
  name: string;
  role?: "super_admin" | "teacher";
}

interface Entry {
  id: string;
  at: number;
  uid: string;
  email: string;
  name: string;
  role: "super_admin" | "teacher";
  action: string;
  grade?: string;
  before?: any;
  after?: any;
  target?: Person;
  changed?: string[];
}

const ACTION_LABEL: Record<string, { label: string; cls: string }> = {
  "exam.add": { label: "Added exam", cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
  "exam.update": { label: "Edited exam", cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
  "exam.delete": { label: "Deleted exam", cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
  "user.create": { label: "Added user", cls: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300" },
  "user.update": { label: "Edited user", cls: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300" },
  "user.delete": { label: "Removed user", cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
  "user.kick": { label: "Force logout", cls: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300" },
};

const sched = (s?: Subject | null) => (s?.start ? `${fmtDate(s.start)} · ${fmtTime(s.start)} – ${fmtTime(s.end)}` : "No schedule");

export default function ActivityLog() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [who, setWho] = useState("all");
  const [kind, setKind] = useState<"all" | "exam" | "user">("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async (before?: number) => {
    setError(null);
    try {
      const r = await adminApi<{ entries: Entry[]; more: boolean }>(`audit${before ? `&before=${before}` : ""}`);
      setEntries((prev) => (before ? [...(prev || []), ...r.entries] : r.entries));
      setMore(r.more);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const people = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of entries || []) m.set(e.uid, e.name || e.email);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [entries]);

  if (error && !entries) return <ErrorCard message={error} onRetry={() => load()} />;
  if (!entries) return <LoadingCard />;

  const q = search.trim().toLowerCase();
  const shown = entries.filter((e) => {
    if (who !== "all" && e.uid !== who) return false;
    if (kind !== "all" && !e.action.startsWith(kind)) return false;
    if (!q) return true;
    return JSON.stringify([e.name, e.email, e.grade, e.before, e.after, e.target]).toLowerCase().includes(q);
  });

  const loadMore = async () => {
    setLoadingMore(true);
    await load(entries[entries.length - 1]?.at);
    setLoadingMore(false);
  };

  const selectCls =
    "h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-[#0F172A] dark:text-white outline-none focus:border-[#4F46E5]";

  return (
    <div className="space-y-4 max-w-5xl">
      <p className="text-[11px] text-slate-400">
        Every change to exams and user accounts is recorded here with who made it and when. Only admins can see this page.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon def={icons.search} size={15} className="text-slate-400" />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, grade, person…"
            className={`${selectCls} w-full pl-9`}
          />
        </div>
        <select value={who} onChange={(e) => setWho(e.target.value)} className={selectCls}>
          <option value="all">Everyone</option>
          {people.map(([uid, label]) => (
            <option key={uid} value={uid}>{label}</option>
          ))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value as any)} className={selectCls}>
          <option value="all">All changes</option>
          <option value="exam">Exams</option>
          <option value="user">Users</option>
        </select>
        <button
          onClick={() => load()}
          className="h-9 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:text-[#4F46E5] hover:border-[#4F46E5]/50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Icon def={icons.refresh} size={13} />
          Refresh
        </button>
      </div>

      <div className={`${cardCls} divide-y divide-slate-50 dark:divide-slate-800`}>
        {shown.length === 0 && <div className="py-16 text-center text-sm text-slate-400">No activity {entries.length ? "matches these filters" : "recorded yet"}.</div>}
        {shown.map((e) => {
          const a = ACTION_LABEL[e.action] || { label: e.action, cls: "bg-slate-100 text-slate-500" };
          return (
            <div key={e.id} className="p-4 flex gap-3">
              <Avatar name={e.name || e.email} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-[#0F172A] dark:text-white">{e.name || e.email}</span>
                  <RoleBadge role={e.role} />
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.cls}`}>{a.label}</span>
                  {e.grade && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] font-medium">{e.grade}</span>}
                  <span className="ml-auto text-[10px] text-slate-400 whitespace-nowrap" style={mono} title={new Date(e.at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}>
                    {fmtDate(new Date(e.at).toISOString())} · {fmtTime(new Date(e.at).toISOString())} · {timeAgo(e.at)}
                  </span>
                </div>
                {e.name && <div className="text-[10px] text-slate-400 truncate" style={mono}>{e.email}</div>}
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <Details e={e} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {more && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full h-9 text-xs font-medium text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg hover:text-[#4F46E5] transition-colors flex items-center justify-center gap-2"
        >
          {loadingMore && <Spinner className="w-3 h-3" />}
          Load older activity
        </button>
      )}
    </div>
  );
}

function Diff({ label, from, to }: { label: string; from: ReactNode; to: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-20 shrink-0">{label}</span>
      <span className="line-through text-red-500/80 break-all">{from}</span>
      <span className="text-slate-400">→</span>
      <span className="text-emerald-600 dark:text-emerald-400 font-medium break-all">{to}</span>
    </div>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-20 shrink-0">{label}</span>
      <span className="break-all">{children}</span>
    </div>
  );
}

function Details({ e }: { e: Entry }) {
  const b = e.before as Subject | null;
  const n = e.after as Subject | null;

  if (e.action === "exam.add" && n) {
    return (
      <>
        <Line label="Subject"><b>{n.subject}</b></Line>
        <Line label="Schedule">{sched(n)}</Line>
        {n.link && <Line label="Link">{n.link}</Line>}
      </>
    );
  }
  if (e.action === "exam.delete" && b) {
    return (
      <>
        <Line label="Subject"><b>{b.subject}</b></Line>
        <Line label="Schedule">{sched(b)}</Line>
      </>
    );
  }
  if (e.action === "exam.update" && b && n) {
    const rows: ReactNode[] = [];
    if (b.subject !== n.subject) rows.push(<Diff key="n" label="Name" from={b.subject} to={n.subject} />);
    else rows.push(<Line key="n" label="Subject"><b>{n.subject}</b></Line>);
    if (b.start !== n.start || b.end !== n.end) rows.push(<Diff key="s" label="Schedule" from={sched(b)} to={sched(n)} />);
    if ((b.link || "") !== (n.link || "")) rows.push(<Diff key="l" label="Link" from={b.link || "none"} to={n.link || "none"} />);
    if (rows.length === 1) rows.push(<div key="x" className="text-slate-400">Saved with no changes</div>);
    return <>{rows}</>;
  }

  const t = e.target;
  if (e.action === "user.update" && e.before && e.after) {
    const rows: ReactNode[] = [<Line key="u" label="User">{t?.name || t?.email}</Line>];
    for (const k of e.changed || []) {
      if (k === "password") rows.push(<Line key={k} label="Password">changed</Line>);
      else if (k === "role") rows.push(<Diff key={k} label="Role" from={e.before.role === "super_admin" ? "Admin" : "Teacher"} to={e.after.role === "super_admin" ? "Admin" : "Teacher"} />);
      else rows.push(<Diff key={k} label={k} from={e.before[k] || "—"} to={e.after[k] || "—"} />);
    }
    return <>{rows}</>;
  }
  if (t) {
    return (
      <Line label="User">
        {t.name ? `${t.name} · ` : ""}
        <span style={mono}>{t.email}</span>
        {t.role && <span className="ml-1.5 align-middle"><RoleBadge role={t.role} /></span>}
      </Line>
    );
  }
  return null;
}
