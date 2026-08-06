import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { themes, defaultThemeId } from "./themes";
import type { ThemeId } from "./types";
import { getSetting, setSetting } from "@app/settings/settingsStore";

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const SETTING_KEY = "atlas.theme";

function applyThemeVariables(themeId: ThemeId): void {
  const theme = themes[themeId];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--atlas-${camelToKebab(key)}`, value);
  }
  root.dataset.theme = themeId;
}

function camelToKebab(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [themeId, setThemeIdState] = useState<ThemeId>(defaultThemeId);

  useEffect(() => {
    let cancelled = false;
    getSetting<ThemeId>(SETTING_KEY, defaultThemeId).then((stored) => {
      if (!cancelled) setThemeIdState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyThemeVariables(themeId);
  }, [themeId]);

  const setThemeId = (id: ThemeId): void => {
    setThemeIdState(id);
    void setSetting(SETTING_KEY, id);
  };

  const value = useMemo(() => ({ themeId, setThemeId }), [themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
