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

export type ThemeId = "dark" | "light";
