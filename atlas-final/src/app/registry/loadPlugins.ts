/**
 * Central plugin loading point.
 *
 * This is the ONLY file in core that imports concrete plugin code.
 * Each plugin's register() call wires up its asset type, nav entry,
 * and routes. Importing this module (see App.tsx) runs registration
 * immediately, before the route table / nav registry are first read.
 */
import { registerMagicItemPlugin } from "@plugins/magic-item";
import { registerCreaturePlugin } from "@plugins/creature";
import { registerSpellPlugin } from "@plugins/spell";
import { registerPrintStudioPlugin } from "@plugins/print-studio";

export function loadPlugins(): void {
  registerMagicItemPlugin();
  registerCreaturePlugin();
  registerSpellPlugin();
  registerPrintStudioPlugin();
}

loadPlugins();
