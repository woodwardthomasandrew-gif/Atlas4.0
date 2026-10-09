import type { AtlasTheme, ThemeId } from "./types";

export const themes: Record<ThemeId, AtlasTheme> = {
  dark: { id: "dark", name: "Dark", colors: { background: "#111214", surface: "#18191c", surfaceRaised: "#212226", border: "#2b2c31", textPrimary: "#e8e8ea", textSecondary: "#b0b1b8", accent: "#5b8def", accentMuted: "#2c3a52", danger: "#e5484d" } },
  light: { id: "light", name: "Light", colors: { background: "#f6f6f7", surface: "#ffffff", surfaceRaised: "#ffffff", border: "#d2d3d7", textPrimary: "#1a1b1e", textSecondary: "#55565e", accent: "#3563d4", accentMuted: "#dbe4fc", danger: "#c9282e" } },
  midnight: { id: "midnight", name: "Midnight", colors: { background: "#10151d", surface: "#171f2a", surfaceRaised: "#202b39", border: "#344355", textPrimary: "#e6edf5", textSecondary: "#b0bdcc", accent: "#82aee8", accentMuted: "#293d55", danger: "#ef777b" } },
  parchment: { id: "parchment", name: "Parchment", colors: { background: "#eee6d5", surface: "#f7f1e4", surfaceRaised: "#fff9ed", border: "#c9bda7", textPrimary: "#30291f", textSecondary: "#605646", accent: "#765329", accentMuted: "#e6d8bd", danger: "#a63d35" } },
  forest: { id: "forest", name: "Forest", colors: { background: "#131b18", surface: "#1b2721", surfaceRaised: "#26352d", border: "#405347", textPrimary: "#e5eee7", textSecondary: "#b7c8bb", accent: "#9bc6a4", accentMuted: "#304838", danger: "#e87973" } },
  "high-contrast": { id: "high-contrast", name: "High Contrast", colors: { background: "#000000", surface: "#101010", surfaceRaised: "#202020", border: "#a8a8a8", textPrimary: "#ffffff", textSecondary: "#e2e2e2", accent: "#73c7ff", accentMuted: "#174c70", danger: "#ff7777" } },
  "arctic-blue": { id: "arctic-blue", name: "Arctic Blue", colors: { background: "#071a2c", surface: "#102a43", surfaceRaised: "#193954", border: "#41627c", textPrimary: "#e8f5ff", textSecondary: "#bfd4e3", accent: "#62c5ff", accentMuted: "#234e70", danger: "#ff8585" } },
  pastel: { id: "pastel", name: "Pastel", colors: { background: "#f2eef4", surface: "#fbf8f7", surfaceRaised: "#fffdfb", border: "#c9becd", textPrimary: "#302a36", textSecondary: "#5d5362", accent: "#745a8d", accentMuted: "#e7dced", danger: "#a43f50" } },
  "admiralty-chart": { id: "admiralty-chart", name: "Admiralty Chart", colors: { background: "#eee9db", surface: "#f8f4e9", surfaceRaised: "#fffdf5", border: "#b8b4a4", textPrimary: "#202d39", textSecondary: "#4c5b67", accent: "#173c5a", accentMuted: "#d9e1e3", danger: "#9f3c35" } }
};

export const defaultThemeId: ThemeId = "dark";
export const themeOptions = Object.values(themes).map(({ id, name }) => ({ id, name }));
