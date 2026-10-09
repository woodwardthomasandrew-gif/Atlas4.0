export interface AtlasTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    surface: string;
    surfaceRaised: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentMuted: string;
    danger: string;
  };
}

export type ThemeId = "dark" | "light" | "midnight" | "parchment" | "forest" | "high-contrast" | "arctic-blue" | "pastel" | "admiralty-chart";

export type AppearanceMode = "manual" | "scheduled" | "system";
export interface AppearanceSettings {
  mode: AppearanceMode;
  manualTheme: ThemeId;
  dayTheme: ThemeId;
  nightTheme: ThemeId;
  nightStart: string;
  dayStart: string;
  systemLightTheme: ThemeId;
  systemDarkTheme: ThemeId;
}
