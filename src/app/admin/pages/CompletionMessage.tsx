import { icons } from "../icons";
import { cardCls, inputCls, mono } from "../lib";
import { useSetting } from "../useSetting";
import { Alert, ErrorCard, LoadingCard, SaveButton, SectionHeader } from "../components/ui";
import { Icon } from "../icons";

const MAX = 1000;

export default function CompletionMessage() {
  const s = useSetting<{ Message: string }>("FinalMessage", { Message: "" });
  const draft = s.value.Message;

  if (s.loading) return <LoadingCard />;
  if (s.loadError) return <ErrorCard message={s.loadError} onRetry={s.reload} />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className={`${cardCls} overflow-hidden`}>
        <SectionHeader icon={icons.globe} title="Current Message" tone="amber" badge="live · firebase" />
        <div className="p-5">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <Icon def={icons.congratulatory} size={16} className="text-amber-500" />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1 whitespace-pre-wrap">
              {s.saved.Message || <span className="text-slate-400 italic">No message set.</span>}
            </p>
          </div>
        </div>
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <SectionHeader icon={icons.edit} title="Edit Message" />
        <div className="p-5 space-y-4">
          <textarea
            rows={7}
            value={draft}
            onChange={(e) => s.setValue({ Message: e.target.value })}
            placeholder="Write the message students see after finishing their exam in the ExamiSafe app…"
            className={`${inputCls} h-auto px-4 py-3 leading-relaxed resize-none`}
          />

          {s.saveError && <Alert kind="error">{s.saveError}</Alert>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`text-xs ${draft.length > MAX ? "text-red-400" : "text-slate-400"}`} style={mono}>
              {draft.length} / {MAX} characters
            </span>
            <div className="flex items-center gap-3">
              {s.dirty && !s.saving && (
                <button onClick={() => s.setValue(s.saved)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  Discard changes
                </button>
              )}
              <SaveButton
                small
                label="Save Message"
                saving={s.saving}
                saved={s.justSaved}
                disabled={!s.dirty || !draft.trim() || draft.length > MAX}
                onClick={() => s.save()}
              />
            </div>
          </div>

          {s.justSaved && <Alert kind="success">Message saved to Firebase. It is now shown in the ExamiSafe app.</Alert>}
        </div>
      </div>
    </div>
  );
}
