import { Icon, icons } from "../icons";
import { cardCls, display, inputCls, labelCls, mono } from "../lib";
import { useSetting } from "../useSetting";
import { Alert, ErrorCard, LoadingCard, SaveButton } from "../components/ui";

export default function Webconfig() {
  const s = useSetting<{ URL: string }>("WebConfig", { URL: "" });
  const url = s.value.URL;

  if (s.loading) return <LoadingCard />;
  if (s.loadError) return <ErrorCard message={s.loadError} onRetry={s.reload} />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-[#4F46E5] rounded-xl p-5 flex items-center justify-between text-white">
        <div className="min-w-0">
          <p className="text-indigo-200 text-xs mb-1" style={mono}>LIVE WEBSITE URL</p>
          <h2 className="text-lg font-semibold break-all leading-snug" style={display}>
            {s.saved.URL || "—"}
          </h2>
          <p className="text-indigo-200 text-xs mt-1">Stored in Firebase · used by the ExamiSafe app</p>
        </div>
        <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center shrink-0 ml-4">
          <Icon def={icons.globe} size={28} className="text-white" />
        </div>
      </div>

      <div className={`${cardCls} p-6`}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-6 h-6 rounded-md bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 flex items-center justify-center">
            <Icon def={icons.edit} size={13} className="text-[#4F46E5]" />
          </div>
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white" style={display}>
            Update Website URL
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Website URL</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <Icon def={icons.link} size={15} className="text-slate-400" />
              </span>
              <input
                type="url"
                value={url}
                onChange={(e) => s.setValue({ URL: e.target.value })}
                placeholder="https://…"
                className={`${inputCls} h-11 pl-10`}
                style={mono}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">This URL is stored in Firebase and opened inside the ExamiSafe app.</p>
          </div>

          {s.saveError && <Alert kind="error">{s.saveError}</Alert>}

          <div className="flex items-center gap-3 pt-1">
            <SaveButton label="Save URL" saving={s.saving} saved={s.justSaved} disabled={!s.dirty || !url.trim()} onClick={() => s.save()} />
            {s.dirty && !s.saving && (
              <button onClick={() => s.setValue(s.saved)} className="h-10 px-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                Reset
              </button>
            )}
          </div>

          {s.justSaved && <Alert kind="success">Website URL updated in Firebase.</Alert>}
        </div>
      </div>
    </div>
  );
}
