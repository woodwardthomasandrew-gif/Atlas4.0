import type { AssetTypeDefinition } from "@app/plugin-api/types";
import { registerAssetType } from "@app/registry/assetRegistry";
import { registerNavItem } from "@app/navigation/navRegistry";
import { registerRoutes } from "@app/routes/routeRegistry";
import { CREATURE_TYPE, creatureSchema, createDefaultCreatureData, type CreatureData } from "./schema";
import { validateCreature } from "./validate";
import { creatureExporters } from "./exporters";
import { renderCreatureCard } from "./cardRenderer";
import { CreatureEditor } from "./components/CreatureEditor";
import { CreaturePreview } from "./components/CreaturePreview";
import { CreatureListPage } from "./pages/CreatureListPage";
import { CreatureEditPage } from "./pages/CreatureEditPage";

export { CREATURE_TYPE };

const creatureDefinition: AssetTypeDefinition<CreatureData> = {
  type: CREATURE_TYPE,
  label: "Creature",
  pluralLabel: "Creatures",
  schema: creatureSchema,
  editor: CreatureEditor,
  preview: CreaturePreview,
  validate: validateCreature,
  exporters: creatureExporters,
  createDefaultData: createDefaultCreatureData,
  renderCardToCanvas: renderCreatureCard,
  cardSize: { widthIn: 5, heightIn: 7 }
};

export function registerCreaturePlugin(): void {
  registerAssetType(creatureDefinition as AssetTypeDefinition<unknown>);

  registerNavItem({
    id: "creatures",
    label: "Creatures",
    path: "/creatures",
    order: 20
  });

  registerRoutes([
    { path: "/creatures", element: <CreatureListPage /> },
    { path: "/creatures/:id", element: <CreatureEditPage /> }
  ]);
}
