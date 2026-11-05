import { useState } from "react";
import { auth } from "../../../../api/firebase-client";
import { Icon, icons } from "../icons";
import { adminApi, cardCls, display, mono, timeAgo } from "../lib";
import { useSession } from "../SessionContext";
import { presenceStatus, useOnlineUsers, type OnlineUser, type PresenceStatus } from "../usePresence";
import { Alert, Avatar, ConfirmDialog, ErrorCard, LoadingCard, RoleBadge } from "../components/ui";

const statusDot: Record<PresenceStatus, string> = { Active: "#10B981", Idle: "#F59E0B", Away: "#94A3B8" };

const statusBadge: Record<PresenceStatus, { text: string; bg: string; darkText: string; darkBg: string }> = {
  Active: { text: "#059669", bg: "#ECFDF5", darkText: "#34d399", darkBg: "#064e3b" },
  Idle: { text: "#D97706", bg: "#FFFBEB", darkText: "#fbbf24", darkBg: "#451a03" },
  Away: { text: "#64748B", bg: "#F8FAFC", darkText: "#94a3b8", darkBg: "#1e293b" },
};

const fmtClock = (ms: number) => new Date(ms).toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" });

export default function WhoIsOnline({ dark }: { dark: boolean }) {
  const { users, serverNow, error, reload, setUsers } = useOnlineUsers(10_000);
  const [kickTarget, setKickTarget] = useState<OnlineUser | null>(null);
  const [kicking, setKicking] = useState(false);
  const [kickError, setKickError] = useState("");
  const [notice, setNotice] = useState("");
  const myUid = auth.currentUser?.uid;
  const { isSuper } = useSession();

  if (error && !users) return <ErrorCard message={error} onRetry={reload} />;
  if (!users) return <LoadingCard />;

  const withStatus = users.map((u) => ({ ...u, status: presenceStatus(u, serverNow) }));
  const counts = {
    total: withStatus.filter((u) => u.status !== "Away").length,
    active: withStatus.filter((u) => u.status === "Active").length,
    idle: withStatus.filter((u) => u.status === "Idle").length,
    away: withStatus.filter((u) => u.status === "Away").length,
  };

  const handleKick = async () => {
    if (!kickTarget) return;
    setKicking(true);
    setKickError("");
    try {
      await adminApi("presence", { op: "kick", uid: kickTarget.uid });
      setUsers((prev) => prev?.filter((u) => u.uid !== kickTarget.uid) ?? null);
      setNotice(`${kickTarget.name || kickTarget.email} was signed out.`);
      setTimeout(() => setNotice(""), 4000);
      setKickTarget(null);
    } catch (e: any) {
      setKickError(e.message);
    } finally {
      setKicking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Online", value: counts.total, color: "#4F46E5", bg: "#EEF2FF", darkBg: "#1e1b4b" },
          { label: "Active", value: counts.active, color: "#10B981", bg: "#ECFDF5", darkBg: "#064e3b" },
          { label: "Idle", value: counts.idle, color: "#F59E0B", bg: "#FFFBEB", darkBg: "#451a03" },
          { label: "Away", value: counts.away, color: "#94A3B8", bg: "#F8FAFC", darkBg: "#1e293b" },
        ].map((s) => (
          <div key={s.label} className={`${cardCls} p-4 flex items-center gap-3`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: dark ? s.darkBg : s.bg }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            </div>
            <div>
              <div className="text-xl font-bold" style={{ ...display, color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-slate-500 dark:text-slate-400" style={mono}>
          Live · refreshes every 10s · {fmtClock(serverNow)}
        </span>
      </div>
      <p className="text-[11px] text-slate-400 -mt-4">
        Shows admins signed in to this dashboard. Idle = no activity for 2 min · Away = dashboard closed or asleep.
      </p>

      {notice && <Alert kind="success">{notice}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {withStatus.map((u) => {
          const sb = statusBadge[u.status];
          const isMe = u.uid === myUid;
          const label = u.name || u.email;
          return (
            <div key={u.uid} className={`${cardCls} p-5 hover:shadow-sm transition-shadow`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="relative shrink-0">
                  <Avatar name={label} photo={u.photo} size={44} />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#161B22]"
                    style={{ backgroundColor: statusDot[u.status] }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#0F172A] dark:text-white leading-tight truncate">
                        {label}
                        {isMe && <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] align-middle">You</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate" style={mono}>{u.name ? u.email : ""}</div>
                      <div className="mt-1"><RoleBadge role={u.role || "teacher"} /></div>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: dark ? sb.darkText : sb.text, backgroundColor: dark ? sb.darkBg : sb.bg }}
                    >
                      {u.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                {[
                  { label: "Login Time", value: fmtClock(u.loginAt) },
                  { label: "Last Activity", value: timeAgo(u.lastActivity, serverNow) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-slate-600 dark:text-slate-300" style={mono}>{row.value}</span>
                  </div>
                ))}
              </div>

              {!isMe && isSuper && (
                <button
                  onClick={() => {
                    setKickError("");
                    setKickTarget(u);
                  }}
                  className="w-full h-8 text-xs text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-100 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800/50 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Icon def={icons.logout} size={13} />
                  Force Logout
                </button>
              )}
            </div>
          );
        })}
      </div>

      {withStatus.length === 0 && (
        <div className={`${cardCls} py-20 text-center`}>
          <Icon def={icons.whoOnline} size={32} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No users are currently online.</p>
        </div>
      )}

      {kickTarget && (
        <ConfirmDialog
          title="Force logout?"
          message={<>{kickTarget.name || kickTarget.email} will be signed out of the dashboard on all devices. They can sign in again with their password.</>}
          confirmLabel="Sign them out"
          busy={kicking}
          error={kickError}
          onCancel={() => setKickTarget(null)}
          onConfirm={handleKick}
        />
      )}
    </div>
  );
}
