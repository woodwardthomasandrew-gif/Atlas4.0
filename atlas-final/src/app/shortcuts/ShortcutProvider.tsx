import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { shortcutDefinitions } from "./shortcutRegistry";
import { CommandPalette } from "@ui/command-palette/CommandPalette";

type Handler = () => void | Promise<void>;
interface ShortcutContextValue {
  register: (id: string, handler: Handler) => () => void;
  run: (id: string) => void;
  openPalette: (initialQuery?: string) => void;
  closePalette: () => void;
}
const ShortcutContext = createContext<ShortcutContextValue | null>(null);

function isTextEntry(target: EventTarget | null): boolean {
  const element = target instanceof HTMLElement ? target : null;
  if (!element) return false;
  return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) || element.getAttribute("role") === "textbox";
}

function matches(event: KeyboardEvent, key: string): boolean {
  return event.key.toLowerCase() === key.toLowerCase() && event.ctrlKey && !event.altKey && !event.metaKey;
}

export function ShortcutProvider({ children }: { children: ReactNode }): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const handlers = useRef(new Map<string, Handler>());
  const [paletteQuery, setPaletteQuery] = useState<string | null>(null);
  const register = useCallback((id: string, handler: Handler) => {
    handlers.current.set(id, handler);
    return () => handlers.current.delete(id);
  }, []);
  const openPalette = useCallback((initialQuery = "") => setPaletteQuery(initialQuery), []);
  const closePalette = useCallback(() => setPaletteQuery(null), []);
  const run = useCallback((id: string) => { const handler = handlers.current.get(id); if (handler) void handler(); }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const typing = isTextEntry(event.target);
      let action: string | undefined;
      if (event.key === "Escape") action = "close-overlay";
      else if (matches(event, "k")) action = "command-palette";
      else if (matches(event, "n")) action = "new-asset";
      else if (matches(event, "p")) action = "print-studio";
      else if (matches(event, "s")) action = "save";
      else if (matches(event, ",")) action = "settings";
      else if (matches(event, "1")) action = "dashboard";
      else if (matches(event, "2")) action = "magic-items";
      else if (matches(event, "3")) action = "creatures";
      else if (matches(event, "4")) action = "spells";
      else if (matches(event, "5")) action = "print-studio-nav";
      else if (matches(event, "6")) action = "handout-studio-nav";
      else if (matches(event, "z")) action = event.shiftKey ? "redo" : "undo";
      else if (matches(event, "d")) action = "duplicate";
      if (!action) return;
      const definition = shortcutDefinitions.find((item) => item.id === action);
      if (typing && !definition?.allowInTextEntry) return;
      // Leave the browser's native text undo stack intact while a text field
      // is focused; editor-level undo is available everywhere else.
      if (typing && (action === "undo" || action === "redo")) return;
      if (action === "command-palette") { event.preventDefault(); openPalette(); return; }
      if (action === "close-overlay") {
        if (paletteQuery !== null) { event.preventDefault(); closePalette(); return; }
        const handler = handlers.current.get(action);
        if (handler) { event.preventDefault(); void handler(); }
        return;
      }
      const handler = handlers.current.get(action);
      if (handler) { event.preventDefault(); void handler(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePalette, location.pathname, openPalette, paletteQuery]);

  useEffect(() => {
    const navigation: Record<string, string> = { dashboard: "/", "magic-items": "/magic-items", creatures: "/creatures", spells: "/spells", "print-studio-nav": "/print-studio", "handout-studio-nav": "/handout-studio", settings: "/settings", "print-studio": "/print-studio" };
    const cleanups = Object.entries(navigation).map(([id, path]) => register(id, () => navigate(path)));
    const currentRoot = ["/magic-items", "/creatures", "/spells", "/print-studio", "/handout-studio"].find((path) => location.pathname.startsWith(path));
    cleanups.push(register("new-asset", () => navigate(currentRoot ? `${currentRoot}/new` : "/magic-items/new")));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [location.pathname, navigate, register]);

  const value = useMemo(() => ({ register, run, openPalette, closePalette }), [closePalette, openPalette, register, run]);
  return <ShortcutContext.Provider value={value}>{children}<CommandPalette initialQuery={paletteQuery} onClose={closePalette} /></ShortcutContext.Provider>;
}

export function useShortcutAction(id: string, handler: Handler, enabled = true): void {
  const context = useContext(ShortcutContext);
  useEffect(() => enabled && context ? context.register(id, handler) : undefined, [context, enabled, handler, id]);
}

export function useShortcutContext(): ShortcutContextValue {
  const context = useContext(ShortcutContext);
  if (!context) throw new Error("useShortcutContext must be used inside ShortcutProvider");
  return context;
}
