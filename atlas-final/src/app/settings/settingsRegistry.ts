import type { ComponentType } from "react";

/**
 * A pluggable section of the (future) Settings screen. Core registers
 * nothing by default beyond this API — asset plugins can register their
 * own settings panels without the core app knowing about them.
 */
export interface SettingsSection {
  id: string;
  label: string;
  component: ComponentType;
}

const sections = new Map<string, SettingsSection>();

export function registerSettingsSection(section: SettingsSection): void {
  if (sections.has(section.id)) {
    throw new Error(`Settings section "${section.id}" is already registered.`);
  }
  sections.set(section.id, section);
}

export function getSettingsSections(): SettingsSection[] {
  return Array.from(sections.values());
}
