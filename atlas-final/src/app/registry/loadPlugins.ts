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
import { registerTraitStudioPlugin } from "@plugins/trait";
import { registerSearchProvider } from "@app/search/searchRegistry";
import { listAssets } from "@app/db/assetStore";
import { getNavItems } from "@app/navigation/navRegistry";

export function loadPlugins(): void {
  registerMagicItemPlugin();
  registerCreaturePlugin();
  registerSpellPlugin();
  registerPrintStudioPlugin();
  registerTraitStudioPlugin();
  registerSearchProvider("assets", async (query) => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return (await listAssets()).filter((asset) => asset.name.toLowerCase().includes(term)).map((asset) => ({
      id: asset.id,
      title: asset.name || "Untitled asset",
      subtitle: asset.type,
      assetType: asset.type,
      onSelect: () => {
        const path = getNavItems().find((item) => item.path.includes(asset.type))?.path;
        if (path) window.location.hash = `#${path}/${asset.id}`;
      }
    }));
  });
}

loadPlugins();
