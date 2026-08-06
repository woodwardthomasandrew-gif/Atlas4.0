import type { AtlasTheme, ThemeId } from "./types";

/**
 * Atlas ships with two minimal, non-decorative themes. There is no
 * "fantasy" styling anywhere in core — plugins may layer their own
 * presentation inside their editors, but the shell stays neutral.
 */
export const themes: Record<ThemeId, AtlasTheme> = {
  dark: {
    id: "dark",
    name: "Dark",
    colors: {
      background: "#111214",
      surface: "#18191c",
      surfaceRaised: "#212226",
      border: "#2b2c31",
      textPrimary: "#e8e8ea",
      textSecondary: "#9a9ba3",
      accent: "#5b8def",
      accentMuted: "#2c3a52",
      danger: "#e5484d"
    }
  },
  light: {
    id: "light",
    name: "Light",
    colors: {
      background: "#f6f6f7",
      surface: "#ffffff",
      surfaceRaised: "#ffffff",
      border: "#e1e1e3",
      textPrimary: "#1a1b1e",
      textSecondary: "#5c5d66",
      accent: "#3563d4",
      accentMuted: "#dbe4fc",
      danger: "#c9282e"
    }
  }
};

export const defaultThemeId: ThemeId = "dark";
