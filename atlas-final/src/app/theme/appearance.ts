import { defaultThemeId, themes } from "./themes";
import type { AppearanceSettings, ThemeId } from "./types";

export const APPEARANCE_SETTING_KEY = "atlas.appearance";
export const LEGACY_THEME_SETTING_KEY = "atlas.theme";
export const defaultAppearance: AppearanceSettings = {
  mode: "manual", manualTheme: defaultThemeId, dayTheme: "light", nightTheme: "midnight",
  nightStart: "19:00", dayStart: "07:00", systemLightTheme: "light", systemDarkTheme: "dark"
};

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(themes, value);
}
export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function validateAppearance(value: unknown, legacyTheme: unknown = defaultThemeId): AppearanceSettings {
  const raw = value && typeof value === "object" ? value as Partial<AppearanceSettings> : {};
  const mode = raw.mode === "scheduled" || raw.mode === "system" ? raw.mode : "manual";
  return {
    mode,
    manualTheme: isThemeId(raw.manualTheme) ? raw.manualTheme : isThemeId(legacyTheme) ? legacyTheme : defaultThemeId,
    dayTheme: isThemeId(raw.dayTheme) ? raw.dayTheme : defaultAppearance.dayTheme,
    nightTheme: isThemeId(raw.nightTheme) ? raw.nightTheme : defaultAppearance.nightTheme,
    nightStart: isValidTime(raw.nightStart) ? raw.nightStart : defaultAppearance.nightStart,
    dayStart: isValidTime(raw.dayStart) ? raw.dayStart : defaultAppearance.dayStart,
    systemLightTheme: isThemeId(raw.systemLightTheme) ? raw.systemLightTheme : defaultAppearance.systemLightTheme,
    systemDarkTheme: isThemeId(raw.systemDarkTheme) ? raw.systemDarkTheme : defaultAppearance.systemDarkTheme
  };
}

function minutes(value: string): number { const [hours, mins] = value.split(":").map(Number); return hours * 60 + mins; }
export function isNightPeriod(date: Date, nightStart: string, dayStart: string): boolean {
  if (!isValidTime(nightStart) || !isValidTime(dayStart)) return false;
  const start = minutes(nightStart), end = minutes(dayStart);
  if (start === end) return false;
  const now = date.getHours() * 60 + date.getMinutes();
  return start < end ? now >= start && now < end : now >= start || now < end;
}
export function resolveAppearanceTheme(settings: AppearanceSettings, date = new Date(), systemDark = false): ThemeId {
  if (settings.mode === "scheduled") return isNightPeriod(date, settings.nightStart, settings.dayStart) ? settings.nightTheme : settings.dayTheme;
  if (settings.mode === "system") return systemDark ? settings.systemDarkTheme : settings.systemLightTheme;
  return settings.manualTheme;
}
