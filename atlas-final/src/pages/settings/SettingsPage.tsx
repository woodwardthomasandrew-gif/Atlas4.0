import { shortcutDefinitions } from "@app/shortcuts/shortcutRegistry";
import { getSettingsSections } from "@app/settings/settingsRegistry";
import { getSetting } from "@app/settings/settingsStore";
import { AUTOSAVE_INTERVAL_KEY, DEFAULT_AUTOSAVE_INTERVAL_MINUTES, saveAutosaveInterval } from "@app/save/SaveProvider";
import { useEffect, useState } from "react";
import "./SettingsPage.css";

export function SettingsPage(): JSX.Element {
  const [interval, setInterval] = useState(DEFAULT_AUTOSAVE_INTERVAL_MINUTES);
  useEffect(() => { void getSetting(AUTOSAVE_INTERVAL_KEY, DEFAULT_AUTOSAVE_INTERVAL_MINUTES).then(setInterval); }, []);
  const updateInterval = (value: number): void => { const next = Math.min(60, Math.max(1, value || DEFAULT_AUTOSAVE_INTERVAL_MINUTES)); setInterval(next); void saveAutosaveInterval(next); };
  return <div className="atlas-settings"><h1>Settings</h1><section className="atlas-settings__section"><h2>Autosave</h2><p className="atlas-settings__muted">Atlas saves the open asset periodically and once more before closing.</p><label className="atlas-settings__field"><span>Autosave interval (minutes)</span><input type="number" min="1" max="60" value={interval} onChange={(event) => updateInterval(Number(event.target.value))} /></label></section><section className="atlas-settings__section"><h2>Keyboard Shortcuts</h2><p className="atlas-settings__muted">Available throughout Atlas. Shortcuts are disabled while typing unless they are editing actions.</p><dl className="atlas-settings__shortcuts">{shortcutDefinitions.map((shortcut) => <div key={shortcut.id}><dt>{shortcut.label}</dt><dd>{shortcut.keys}</dd></div>)}</dl></section>{getSettingsSections().map(({ id, label, component: Section }) => <section className="atlas-settings__section" key={id}><h2>{label}</h2><Section /></section>)}</div>;
}
