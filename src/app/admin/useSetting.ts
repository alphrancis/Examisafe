import { useCallback, useEffect, useState } from "react";
import { loadSetting, saveSetting } from "./lib";

/** Load / edit / save one document in the TNHSAExamiSafe collection. */
export function useSetting<T extends object>(name: string, fallback: T) {
  const [saved, setSavedValue] = useState<T>(fallback);
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const v = await loadSetting<T>(name, fallback);
      setSavedValue(v);
      setValue(v);
    } catch (e: any) {
      setLoadError(e.message || "Could not load from Firebase");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (next?: T) => {
      const data = next ?? value;
      setSaving(true);
      setSaveError(null);
      try {
        await saveSetting(name, data);
        setSavedValue(data);
        setValue(data);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
        return true;
      } catch (e: any) {
        setSaveError(e.message || "Could not save to Firebase");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [name, value]
  );

  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  return { value, setValue, saved, loading, loadError, reload: load, save, saving, justSaved, saveError, dirty };
}
