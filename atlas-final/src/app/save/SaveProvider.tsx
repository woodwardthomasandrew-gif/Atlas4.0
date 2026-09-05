import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getSetting, setSetting } from "@app/settings/settingsStore";
import "./SaveProvider.css";

export const AUTOSAVE_INTERVAL_KEY = "atlas.autosaveIntervalMinutes";
export const DEFAULT_AUTOSAVE_INTERVAL_MINUTES = 5;
export type SaveReason = "manual" | "auto" | "close";
type SaveHandler = (reason: SaveReason) => Promise<boolean>;
interface SaveContextValue { registerSaveHandler: (handler: SaveHandler) => () => void; notifySaved: (reason: SaveReason) => void; }
const SaveContext = createContext<SaveContextValue | null>(null);

function messageFor(reason: SaveReason): string { return reason === "auto" ? "Autosaved" : reason === "close" ? "Saved before closing" : "Saved"; }

export function SaveProvider({ children }: { children: ReactNode }): JSX.Element {
  const handlerRef = useRef<SaveHandler | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const registerSaveHandler = useCallback((handler: SaveHandler) => { handlerRef.current = handler; return () => { if (handlerRef.current === handler) handlerRef.current = null; }; }, []);
  const notifySaved = useCallback((reason: SaveReason) => setNotification(`${messageFor(reason)} · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`), []);

  useEffect(() => {
    const onRequestSave = async (): Promise<void> => { try { const saved = await handlerRef.current?.("close"); if (saved) notifySaved("close"); } finally { await window.atlas.app.saveComplete(); } };
    return window.atlas.app.onRequestSave(onRequestSave);
  }, [notifySaved]);
  useEffect(() => { if (!notification) return; const timer = window.setTimeout(() => setNotification(null), 3000); return () => window.clearTimeout(timer); }, [notification]);
  const value = useMemo(() => ({ registerSaveHandler, notifySaved }), [notifySaved, registerSaveHandler]);
  return <SaveContext.Provider value={value}>{children}{notification && <div className="atlas-save-notification" role="status" aria-live="polite">{notification}</div>}</SaveContext.Provider>;
}

export function useSaveContext(): SaveContextValue { const context = useContext(SaveContext); if (!context) throw new Error("useSaveContext must be used within SaveProvider"); return context; }

export function useAutosave(save: SaveHandler, enabled: boolean): void {
  const { registerSaveHandler, notifySaved } = useSaveContext();
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => registerSaveHandler(async (reason) => { const saved = await saveRef.current(reason); if (saved) notifySaved(reason); return saved; }), [notifySaved, registerSaveHandler]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false; let timer: number | undefined;
    const schedule = async (): Promise<void> => { const minutes = await getSetting(AUTOSAVE_INTERVAL_KEY, DEFAULT_AUTOSAVE_INTERVAL_MINUTES); if (cancelled) return; timer = window.setTimeout(async () => { const saved = await saveRef.current("auto"); if (saved) notifySaved("auto"); if (!cancelled) void schedule(); }, Math.max(1, minutes) * 60_000); };
    void schedule(); return () => { cancelled = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, [enabled, notifySaved]);
}

export async function saveAutosaveInterval(minutes: number): Promise<void> { await setSetting(AUTOSAVE_INTERVAL_KEY, Math.min(60, Math.max(1, Math.round(minutes)))); }
