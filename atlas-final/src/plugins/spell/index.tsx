import type { AssetTypeDefinition } from "@app/plugin-api/types";
import { registerAssetType } from "@app/registry/assetRegistry";
import { registerNavItem } from "@app/navigation/navRegistry";
import { registerRoutes } from "@app/routes/routeRegistry";
import { SPELL_TYPE, spellSchema, createDefaultSpellData, type SpellData } from "./schema";
import { validateSpell } from "./validate";
import { spellExporters } from "./exporters";
import { renderSpellCard } from "./cardRenderer";
import { SpellEditor } from "./components/SpellEditor";
import { SpellPreview } from "./components/SpellPreview";
import { SpellListPage } from "./pages/SpellListPage";
import { SpellEditPage } from "./pages/SpellEditPage";

export { SPELL_TYPE };

const spellDefinition: AssetTypeDefinition<SpellData> = {
  type: SPELL_TYPE,
  label: "Spell",
  pluralLabel: "Spells",
  schema: spellSchema,
  editor: SpellEditor,
  preview: SpellPreview,
  validate: validateSpell,
  exporters: spellExporters,
  createDefaultData: createDefaultSpellData,
  renderCardToCanvas: renderSpellCard,
  cardSize: { widthIn: 3.5, heightIn: 5 }
};

export function registerSpellPlugin(): void {
  registerAssetType(spellDefinition as AssetTypeDefinition<unknown>);

  registerNavItem({
    id: "spells",
    label: "Spells",
    path: "/spells",
    order: 30
  });

  registerRoutes([
    { path: "/spells", element: <SpellListPage /> },
    { path: "/spells/:id", element: <SpellEditPage /> }
  ]);
}
