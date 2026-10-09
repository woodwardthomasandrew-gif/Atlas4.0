import { describe, expect, it } from "vitest";
import { defaultAppearance, isNightPeriod, resolveAppearanceTheme, validateAppearance } from "@app/theme/appearance";
import { themes } from "@app/theme/themes";

describe("workspace appearance", () => {
  it("provides complete palettes for all supported themes including the original pair", () => {
    expect(Object.keys(themes)).toEqual(expect.arrayContaining(["dark", "light", "midnight", "parchment", "forest", "high-contrast", "arctic-blue", "pastel", "admiralty-chart"]));
    for (const theme of Object.values(themes)) expect(Object.keys(theme.colors)).toEqual(["background", "surface", "surfaceRaised", "border", "textPrimary", "textSecondary", "accent", "accentMuted", "danger"]);
  });

  it("loads old theme-only settings as a manual preference and safely validates invalid data", () => {
    expect(validateAppearance(null, "light").manualTheme).toBe("light");
    expect(validateAppearance({ mode: "scheduled", manualTheme: "bogus", nightStart: "26:99", dayTheme: "bogus" }).manualTheme).toBe("dark");
    expect(validateAppearance({ nightStart: "26:99" }).nightStart).toBe(defaultAppearance.nightStart);
  });

  it("resolves manual, system, and scheduled selections", () => {
    expect(resolveAppearanceTheme({ ...defaultAppearance, manualTheme: "parchment" }, new Date(2026, 0, 1, 23))).toBe("parchment");
    expect(resolveAppearanceTheme({ ...defaultAppearance, mode: "system", systemDarkTheme: "midnight" }, new Date(), true)).toBe("midnight");
    expect(resolveAppearanceTheme({ ...defaultAppearance, mode: "scheduled", nightTheme: "forest" }, new Date(2026, 0, 1, 21))).toBe("forest");
    expect(resolveAppearanceTheme({ ...defaultAppearance, mode: "scheduled" }, new Date(2026, 0, 1, 12))).toBe("light");
  });

  it("handles midnight crossing, startup at either period, invalid times, and equal transitions", () => {
    expect(isNightPeriod(new Date(2026, 0, 1, 23), "19:00", "07:00")).toBe(true);
    expect(isNightPeriod(new Date(2026, 0, 1, 6, 59), "19:00", "07:00")).toBe(true);
    expect(isNightPeriod(new Date(2026, 0, 1, 7), "19:00", "07:00")).toBe(false);
    expect(isNightPeriod(new Date(2026, 0, 1, 12), "19:00", "07:00")).toBe(false);
    expect(isNightPeriod(new Date(2026, 0, 1, 22), "bad", "07:00")).toBe(false);
    expect(isNightPeriod(new Date(2026, 0, 1, 22), "08:00", "08:00")).toBe(false);
  });
});
