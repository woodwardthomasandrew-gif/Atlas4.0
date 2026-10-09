import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { themes, defaultThemeId } from "./themes";
import type { AppearanceSettings, ThemeId } from "./types";
import { APPEARANCE_SETTING_KEY, defaultAppearance, LEGACY_THEME_SETTING_KEY, resolveAppearanceTheme, validateAppearance } from "./appearance";
import { getSetting, setSetting } from "@app/settings/settingsStore";

interface ThemeContextValue {
  themeId: ThemeId;
  appearance: AppearanceSettings;
  updateAppearance: (patch: Partial<AppearanceSettings>) => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeVariables(themeId: ThemeId): void {
  const theme = themes[themeId];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) root.style.setProperty(`--atlas-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value);
  root.dataset.theme = themeId;
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance);
  const [loaded, setLoaded] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getSetting<unknown>(APPEARANCE_SETTING_KEY, null), getSetting<unknown>(LEGACY_THEME_SETTING_KEY, defaultThemeId)]).then(([stored, legacy]) => {
      if (cancelled) return;
      setAppearance(validateAppearance(stored, legacy));
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const themeId = resolveAppearanceTheme(appearance, clock, systemDark);
  useEffect(() => { applyThemeVariables(themeId); }, [themeId]);

  useEffect(() => {
    if (!loaded || appearance.mode !== "scheduled") return;
    const reevaluate = (): void => setClock(new Date());
    const timer = window.setInterval(reevaluate, 30_000);
    window.addEventListener("focus", reevaluate);
    document.addEventListener("visibilitychange", reevaluate);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", reevaluate); document.removeEventListener("visibilitychange", reevaluate); };
  }, [appearance.mode, loaded]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const update = (): void => setSystemDark(media.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const updateAppearance = useCallback((patch: Partial<AppearanceSettings>): void => {
    setAppearance((current) => {
      const next = validateAppearance({ ...current, ...patch }, current.manualTheme);
      void setSetting(APPEARANCE_SETTING_KEY, next);
      void setSetting(LEGACY_THEME_SETTING_KEY, next.manualTheme);
      return next;
    });
    setClock(new Date());
  }, []);
  const value = useMemo(() => ({ themeId, appearance, updateAppearance }), [themeId, appearance, updateAppearance]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
