import { Icon, icons } from "../icons";
import { SCHOOL_NAME, cardCls, display, inputCls, labelCls, mono } from "../lib";
import { useSetting } from "../useSetting";
import { Alert, ErrorCard, LoadingCard, SaveButton } from "../components/ui";

interface AppUpdateData {
  latest_version: string;
  changelog: string;
  download_url1: string;
  download_url2: string;
  download_url3: string;
}

const empty: AppUpdateData = { latest_version: "", changelog: "", download_url1: "", download_url2: "", download_url3: "" };

export default function AppUpdate() {
  const s = useSetting<AppUpdateData>("AppUpdate", empty);
  const form = s.value;
  const set = (k: keyof AppUpdateData, v: string) => s.setValue({ ...form, [k]: v });

  if (s.loading) return <LoadingCard />;
  if (s.loadError) return <ErrorCard message={s.loadError} onRetry={s.reload} />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-[#4F46E5] rounded-xl p-5 flex items-center justify-between text-white">
        <div>
          <p className="text-indigo-200 text-xs mb-1" style={mono}>CURRENT VERSION</p>
          <h2 className="text-2xl font-bold" style={display}>
            v{s.saved.latest_version || "—"}
          </h2>
          <p className="text-indigo-200 text-xs mt-1">{SCHOOL_NAME} · Android</p>
        </div>
        <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
          <Icon def={icons.shield} size={28} className="text-white" />
        </div>
      </div>

      <div className={`${cardCls} p-6`}>
        <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-5" style={display}>
          Update Details
        </h3>

        <div className="space-y-5">
          <div>
            <label className={labelCls}>Version Number</label>
            <input value={form.latest_version} onChange={(e) => set("latest_version", e.target.value)} placeholder="e.g. 2.1.5" className={inputCls} style={mono} />
          </div>

          <div>
            <label className={labelCls}>Change Logs</label>
            <textarea
              rows={4}
              value={form.changelog}
              onChange={(e) => set("changelog", e.target.value)}
              placeholder="Describe what changed in this version…"
              className={`${inputCls} h-auto py-2.5 resize-none leading-relaxed`}
            />
          </div>

          {(["download_url1", "download_url2", "download_url3"] as const).map((key, i) => (
            <div key={key}>
              <label className={`${labelCls} flex items-center gap-1.5`}>
                <span
                  className="inline-flex w-4 h-4 rounded bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 text-[#4F46E5] items-center justify-center"
                  style={{ ...mono, fontSize: "9px", fontWeight: 700 }}
                >
                  {i + 1}
                </span>
                Download URL {i + 1}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon def={icons.link} size={14} className="text-slate-400" />
                </span>
                <input
                  type="url"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder="https://…"
                  className={`${inputCls} pl-9`}
                  style={{ ...mono, fontSize: "12px" }}
                />
              </div>
            </div>
          ))}

          {s.saveError && <Alert kind="error">{s.saveError}</Alert>}

          <div className="pt-1 flex items-center gap-3">
            <SaveButton saving={s.saving} saved={s.justSaved} disabled={!s.dirty} onClick={() => s.save()} />
            {s.dirty && !s.saving && (
              <button onClick={() => s.setValue(s.saved)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                Discard changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
