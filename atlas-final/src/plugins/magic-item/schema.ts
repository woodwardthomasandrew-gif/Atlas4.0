import type { AssetSchema } from "@app/plugin-api/types";

export const MAGIC_ITEM_TYPE = "magic-item";

export type ItemRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "very-rare"
  | "legendary"
  | "artifact";

export const ITEM_RARITIES: ItemRarity[] = [
  "common",
  "uncommon",
  "rare",
  "very-rare",
  "legendary",
  "artifact"
];

export interface MagicItemData {
  itemType: string;
  rarity: ItemRarity;
  requiresAttunement: boolean;
  description: string;
}

export const magicItemSchema: AssetSchema = {
  fields: [
    { key: "itemType", label: "Item Type", type: "string", required: true },
    { key: "rarity", label: "Rarity", type: "enum", required: true, options: ITEM_RARITIES },
    { key: "requiresAttunement", label: "Requires Attunement", type: "boolean" },
    { key: "description", label: "Description", type: "text", required: true }
  ]
};

export function createDefaultMagicItemData(): MagicItemData {
  return {
    itemType: "",
    rarity: "common",
    requiresAttunement: false,
    description: ""
  };
}
