import type { AssetTypeDefinition } from "@app/plugin-api/types";
import { registerAssetType } from "@app/registry/assetRegistry";
import { registerNavItem } from "@app/navigation/navRegistry";
import { registerRoutes } from "@app/routes/routeRegistry";
import {
  MAGIC_ITEM_TYPE,
  magicItemSchema,
  createDefaultMagicItemData,
  type MagicItemData
} from "./schema";
import { validateMagicItem } from "./validate";
import { magicItemExporters } from "./exporters";
import { renderItemCard } from "./cardRenderer";
import { MagicItemEditor } from "./components/MagicItemEditor";
import { MagicItemPreview } from "./components/MagicItemPreview";
import { MagicItemListPage } from "./pages/MagicItemListPage";
import { MagicItemEditPage } from "./pages/MagicItemEditPage";

export { MAGIC_ITEM_TYPE };

const magicItemDefinition: AssetTypeDefinition<MagicItemData> = {
  type: MAGIC_ITEM_TYPE,
  label: "Magic Item",
  pluralLabel: "Magic Items",
  schema: magicItemSchema,
  editor: MagicItemEditor,
  preview: MagicItemPreview,
  validate: validateMagicItem,
  exporters: magicItemExporters,
  createDefaultData: createDefaultMagicItemData,
  renderCardToCanvas: renderItemCard,
  cardSize: { widthIn: 2.5, heightIn: 3.5 }
};

export function registerMagicItemPlugin(): void {
  registerAssetType(magicItemDefinition as AssetTypeDefinition<unknown>);

  registerNavItem({
    id: "magic-items",
    label: "Magic Items",
    path: "/magic-items",
    order: 10
  });

  registerRoutes([
    { path: "/magic-items", element: <MagicItemListPage /> },
    { path: "/magic-items/:id", element: <MagicItemEditPage /> }
  ]);
}
