/**
 * useSaveState — echter Speicher-Zustand für SettingsCard („Gespeichert ✓").
 *
 * `run(promise)` setzt 'saving' WÄHREND die echte Backend-Mutation läuft (kein Fake-Delay),
 * bei Erfolg 'saved' (verblasst nach ~2s wieder auf null), bei Fehler wird der Fehler geworfen
 * (Aufrufer zeigt ihn) und der Zustand auf null zurückgesetzt.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import type { SaveState } from "@/components/panel-blocks/SettingsCard";

export function useSaveState(): { state: SaveState; run: (p: Promise<unknown>) => Promise<void> } {
  const [state, setState] = useState<SaveState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const run = useCallback(async (p: Promise<unknown>) => {
    if (timer.current) clearTimeout(timer.current);
    setState("saving");
    try {
      await p;
      setState("saved");
      timer.current = setTimeout(() => setState(null), 2000);
    } catch (e) {
      setState(null);
      throw e;
    }
  }, []);

  return { state, run };
}
