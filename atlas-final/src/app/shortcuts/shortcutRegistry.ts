export interface ShortcutDefinition {
  id: string;
  label: string;
  keys: string;
  allowInTextEntry?: boolean;
}

export const shortcutDefinitions: ShortcutDefinition[] = [
  { id: "command-palette", label: "Command palette", keys: "Ctrl+K" },
  { id: "new-asset", label: "Create new asset", keys: "Ctrl+N" },
  { id: "print-studio", label: "Open Print Studio", keys: "Ctrl+P" },
  { id: "save", label: "Save current asset", keys: "Ctrl+S", allowInTextEntry: true },
  { id: "settings", label: "Open Settings", keys: "Ctrl+," },
  { id: "dashboard", label: "Dashboard", keys: "Ctrl+1" },
  { id: "magic-items", label: "Magic Items", keys: "Ctrl+2" },
  { id: "creatures", label: "Creatures", keys: "Ctrl+3" },
  { id: "spells", label: "Spells", keys: "Ctrl+4" },
  { id: "print-studio-nav", label: "Print Studio", keys: "Ctrl+5" },
  { id: "undo", label: "Undo", keys: "Ctrl+Z", allowInTextEntry: true },
  { id: "redo", label: "Redo", keys: "Ctrl+Shift+Z", allowInTextEntry: true },
  { id: "duplicate", label: "Duplicate current asset", keys: "Ctrl+D" },
  { id: "close-overlay", label: "Close active modal or overlay", keys: "Escape" }
];
