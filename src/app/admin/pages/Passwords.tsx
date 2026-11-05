import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Icon, icons } from "../icons";
import { cardCls, display, inputCls, labelCls, mono } from "../lib";
import { useSetting } from "../useSetting";
import { Alert, ErrorCard, LoadingCard, SectionHeader, Spinner } from "../components/ui";

type Key = "1" | "2" | "3";
type PasswordData = Record<Key, string>;

const entries: { key: Key; label: string; description: string }[] = [
  { key: "1", label: "App Password 1", description: "Primary app password" },
  { key: "2", label: "App Password 2", description: "Secondary app password" },
  { key: "3", label: "App Password 3", description: "Backup / special access password" },
];

const colors = [
  { ring: "border-[#4F46E5]/30", num: "bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 text-[#4F46E5]" },
  { ring: "border-emerald-300/50 dark:border-emerald-700/30", num: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
  { ring: "border-red-200/60 dark:border-red-900/30", num: "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400" },
];

export default function Passwords({ readOnly = false }: { readOnly?: boolean }) {
  const s = useSetting<PasswordData>("Password", { "1": "", "2": "", "3": "" });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Partial<Record<Key, string>>>({});
  const [savingKey, setSavingKey] = useState<Key | null>(null);
  const [savedKey, setSavedKey] = useState<Key | null>(null);

  if (s.loading) return <LoadingCard />;
  if (s.loadError) return <ErrorCard message={s.loadError} onRetry={s.reload} />;

  const cancel = (k: Key) =>
    setEditing((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });

  const handleSave = async (k: Key) => {
    const next = { ...s.saved, [k]: editing[k] ?? s.saved[k] };
    setSavingKey(k);
    const ok = await s.save(next);
    setSavingKey(null);
    if (ok) {
      cancel(k);
      setSavedKey(k);
      setTimeout(() => setSavedKey(null), 2500);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {readOnly && <Alert kind="success">You can view and copy these passwords. Only an admin can change them.</Alert>}
      <div className={`${cardCls} overflow-hidden`}>
        <SectionHeader icon={icons.passwords} title="System Passwords" badge="firebase" />

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {entries.map((entry, i) => {
            const isEditing = entry.key in editing;
            const isVisible = visible[entry.key];
            const current = s.saved[entry.key] || "";
            const c = colors[i];

            return (
              <div key={entry.key} className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${c.num}`} style={display}>
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A] dark:text-white">{entry.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{entry.description}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                <div className="flex-1 min-w-0">
                <div className={`rounded-lg border p-3 ${c.ring} bg-slate-50/50 dark:bg-slate-800/50`}>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <input
                        type={isVisible ? "text" : "password"}
                        value={editing[entry.key]}
                        onChange={(e) => setEditing((p) => ({ ...p, [entry.key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave(entry.key);
                          if (e.key === "Escape") cancel(entry.key);
                        }}
                        className="flex-1 min-w-0 bg-transparent text-sm text-[#0F172A] dark:text-white outline-none"
                        style={mono}
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 min-w-0 text-sm text-[#0F172A] dark:text-white break-all" style={mono}>
                        {current ? (isVisible ? current : "•".repeat(Math.min(current.length, 24))) : <span className="text-slate-400">Not set</span>}
                      </span>
                    )}
                    <button
                      onClick={() => setVisible((v) => ({ ...v, [entry.key]: !v[entry.key] }))}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
                      title={isVisible ? "Hide" : "Show"}
                    >
                      <Icon def={isVisible ? icons.eyeOff : icons.eye} size={16} />
                    </button>
                    {!isEditing && current && (
                      <button
                        onClick={() => navigator.clipboard?.writeText(current)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
                        title="Copy"
                      >
                        <Icon def={icons.copy} size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2.5">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSave(entry.key)}
                        disabled={savingKey === entry.key || !editing[entry.key]?.trim() || editing[entry.key] === current}
                        className="h-8 px-4 text-xs font-medium bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 text-white rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {savingKey === entry.key ? <Spinner className="w-3 h-3" /> : <Icon def={icons.save} size={12} className="text-white" />}
                        Save
                      </button>
                      <button onClick={() => cancel(entry.key)} className="h-8 px-3 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
                        Cancel
                      </button>
                    </>
                  ) : readOnly ? null : (
                    <>
                      <button
                        onClick={() => setEditing((e) => ({ ...e, [entry.key]: current }))}
                        className="h-8 px-3 text-xs font-medium text-[#4F46E5] bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 hover:bg-[#4F46E5]/20 dark:hover:bg-[#4F46E5]/30 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Icon def={icons.edit} size={12} className="text-[#4F46E5]" />
                        Edit
                      </button>
                      {savedKey === entry.key && (
                        <span className="text-xs text-emerald-500 flex items-center gap-1">
                          <Icon def={icons.check} size={12} className="text-emerald-500" />
                          Saved
                        </span>
                      )}
                    </>
                  )}
                </div>
                </div>
                <PasswordQr value={isEditing ? editing[entry.key] ?? "" : current} name={`password-${entry.key}`} />
                </div>
              </div>
            );
          })}
        </div>
        {s.saveError && (
          <div className="px-5 pb-5">
            <Alert kind="error">{s.saveError}</Alert>
          </div>
        )}
      </div>

      <QrGenerator />
    </div>
  );
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** QR code of one password, shown beside it, with a PNG download. */
function PasswordQr({ value, name }: { value: string; name: string }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!value) {
      setDataUrl("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(value, { width: 512, margin: 2, color: { dark: "#0F172A", light: "#ffffff" } })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(""));
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="flex sm:flex-col items-center gap-3 sm:gap-2 shrink-0">
      <div className="w-24 h-24 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white flex items-center justify-center">
        {dataUrl ? (
          <img src={dataUrl} alt={`QR code for ${name}`} className="w-full h-full" />
        ) : (
          <Icon def={icons.qrcode} size={32} className="text-slate-300" />
        )}
      </div>
      <button
        onClick={() => downloadDataUrl(dataUrl, `examisafe-${name}.png`)}
        disabled={!dataUrl}
        className="h-7 px-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#4F46E5]/50 hover:text-[#4F46E5] rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
      >
        <Icon def={icons.download} size={12} />
        Download
      </button>
    </div>
  );
}

function QrGenerator() {
  const [text, setText] = useState("");
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!text.trim()) {
      setDataUrl("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(text, { width: 512, margin: 2, color: { dark: "#0F172A", light: "#ffffff" } })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(""));
    return () => {
      cancelled = true;
    };
  }, [text]);

  const download = () => dataUrl && downloadDataUrl(dataUrl, `examisafe-qrcode-${Date.now()}.png`);

  return (
    <div className={`${cardCls} overflow-hidden`}>
      <SectionHeader icon={icons.qrcode} title="QR Code Generator" tone="sky" right={<span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-medium" style={mono}>real-time</span>} />
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Text / URL / Data</label>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter a URL, password, or any text to turn into a QR code…"
                className={`${inputCls} h-auto py-2.5 resize-none`}
              />
              <p className="text-[10px] text-slate-400 mt-1.5">QR code updates as you type</p>
            </div>
            <button
              onClick={download}
              disabled={!dataUrl}
              className="h-9 px-4 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <Icon def={icons.download} size={13} />
              Download PNG
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white flex items-center justify-center w-[180px] h-[180px]">
              {dataUrl ? (
                <img src={dataUrl} alt="Generated QR code" className="w-full h-full" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <Icon def={icons.qrcode} size={48} />
                  <span className="text-xs">Enter data</span>
                </div>
              )}
            </div>
            {text.trim() && (
              <p className="text-[10px] text-slate-400 text-center max-w-[180px] truncate" style={mono}>
                {text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
