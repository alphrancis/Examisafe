import type { ReactNode } from "react";
import { Icon, icons } from "../icons";
import { cardCls, display, initials, mono } from "../lib";

export function Avatar({ name, photo, size = 32, className = "" }: { name: string; photo?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (photo) return <img src={photo} alt="" style={style} className={`rounded-full object-cover shrink-0 ${className}`} />;
  return (
    <div style={style} className={`bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 rounded-full flex items-center justify-center shrink-0 ${className}`}>
      <span className="text-[#4F46E5] font-bold" style={{ ...display, fontSize: Math.max(9, size * 0.34) }}>
        {initials(name)}
      </span>
    </div>
  );
}

export function RoleBadge({ role }: { role: "super_admin" | "teacher" }) {
  const sup = role === "super_admin";
  return (
    <span
      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
        sup ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300" : "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300"
      }`}
    >
      {sup ? "Admin" : "Teacher"}
    </span>
  );
}

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function SaveButton({
  saving,
  saved,
  disabled,
  onClick,
  label = "Save Changes",
  type = "button",
  small,
}: {
  saving: boolean;
  saved?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
  type?: "button" | "submit";
  small?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={saving || saved || disabled}
      className={`${small ? "h-9 px-4" : "h-10 px-6"} bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2`}
    >
      {saving ? (
        <>
          <Spinner />
          Saving…
        </>
      ) : saved ? (
        <>
          <Icon def={icons.check} size={16} className="text-white" />
          Saved
        </>
      ) : (
        <>
          <Icon def={icons.save} size={16} className="text-white" />
          {label}
        </>
      )}
    </button>
  );
}

export function Alert({ kind, children }: { kind: "error" | "success"; children: ReactNode }) {
  const err = kind === "error";
  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-lg border ${
        err
          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50"
          : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40"
      }`}
    >
      <Icon def={err ? icons.warning : icons.check} size={14} className={`shrink-0 mt-0.5 ${err ? "text-red-500" : "text-emerald-500"}`} />
      <p className={`text-xs leading-relaxed ${err ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{children}</p>
    </div>
  );
}

export function LoadingCard({ label = "Loading from Firebase…" }: { label?: string }) {
  return (
    <div className={`${cardCls} py-16 flex flex-col items-center gap-3 text-slate-400`}>
      <Spinner className="w-6 h-6 text-[#4F46E5]" />
      <span className="text-xs">{label}</span>
    </div>
  );
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={`${cardCls} p-6 space-y-3`}>
      <Alert kind="error">{message}</Alert>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-medium text-[#4F46E5] hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-100 dark:border-slate-800 p-6 w-full max-w-sm shadow-xl">
        <h4 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-2" style={display}>{title}</h4>
        <div className="text-xs text-slate-500 mb-5 leading-relaxed">{message}</div>
        {error && (
          <div className="mb-4">
            <Alert kind="error">{error}</Alert>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 h-9 text-sm text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 h-9 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {busy && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ icon, title, badge, tone = "indigo", right }: {
  icon: typeof icons.dashboard;
  title: string;
  badge?: string;
  tone?: "indigo" | "amber" | "sky" | "emerald";
  right?: ReactNode;
}) {
  const tones = {
    indigo: "bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 text-[#4F46E5]",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-500",
    sky: "bg-sky-100 dark:bg-sky-900/30 text-sky-500",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500",
  };
  return (
    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${tones[tone]}`}>
        <Icon def={icon} size={13} />
      </div>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
      {badge && (
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium" style={mono}>
          {badge}
        </span>
      )}
      {right && <div className={badge ? "" : "ml-auto"}>{right}</div>}
    </div>
  );
}
