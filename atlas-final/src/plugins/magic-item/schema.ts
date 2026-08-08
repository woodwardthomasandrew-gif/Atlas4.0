import type { AssetSchema } from "@app/plugin-api/types";
import {
  DAMAGE_DIE_TYPES,
  DAMAGE_TYPES,
  createDefaultDamage,
  type DamageDieType,
  type DamageType,
  type ItemDamage
} from "@plugins/shared/damage";

export { DAMAGE_DIE_TYPES, DAMAGE_TYPES, createDefaultDamage };
export type { DamageDieType, DamageType, ItemDamage };

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

export type RechargeTiming = "dawn" | "dusk" | "long-rest" | "short-rest" | "other";

export const RECHARGE_TIMINGS: RechargeTiming[] = [
  "dawn",
  "dusk",
  "long-rest",
  "short-rest",
  "other"
];

export interface ItemCharges {
  max: number;
  current: number;
  /** Dice/bonus formula used when charges are regained, e.g. "1d6+2". Optional — a flat max may just refill. */
  rechargeFormula: string;
  rechargeTiming: RechargeTiming;
}

export interface MagicItemData {
  itemType: string;
  rarity: ItemRarity;
  requiresAttunement: boolean;
  weightLb: number;
  valueGp: number;
  /** Narrative/lore text — how the item looks, feels, its history. */
  flavorText: string;
  /** Rules text — what the item actually does mechanically. */
  mechanicalText: string;
  hasCharges: boolean;
  charges: ItemCharges;
  hasDamage: boolean;
  damage: ItemDamage;
}

export const magicItemSchema: AssetSchema = {
  fields: [
    { key: "itemType", label: "Item Type", type: "string", required: true },
    { key: "rarity", label: "Rarity", type: "enum", required: true, options: ITEM_RARITIES },
    { key: "requiresAttunement", label: "Requires Attunement", type: "boolean" },
    { key: "weightLb", label: "Weight (lb)", type: "number" },
    { key: "valueGp", label: "Value (gp)", type: "number" },
    { key: "flavorText", label: "Flavor Text", type: "text" },
    { key: "mechanicalText", label: "Mechanical Text", type: "text", required: true },
    { key: "hasCharges", label: "Has Charges", type: "boolean" },
    { key: "hasDamage", label: "Deals Damage", type: "boolean" }
  ]
};

export function createDefaultCharges(): ItemCharges {
  return {
    max: 1,
    current: 1,
    rechargeFormula: "",
    rechargeTiming: "dawn"
  };
}

export function createDefaultMagicItemData(): MagicItemData {
  return {
    itemType: "",
    rarity: "common",
    requiresAttunement: false,
    weightLb: 0,
    valueGp: 0,
    flavorText: "",
    mechanicalText: "",
    hasCharges: false,
    charges: createDefaultCharges(),
    hasDamage: false,
    damage: createDefaultDamage()
  };
}

/**
 * Backfills fields on records saved by older versions of this schema
 * (e.g. before flavor/mechanical text, weight/value, charges, or damage
 * existed) so every consumer — editor, preview, card renderer, exporters —
 * can rely on every field always being present and correctly typed.
 */
export function normalizeMagicItemData(raw: unknown): MagicItemData {
  const data = (raw ?? {}) as Partial<MagicItemData> & { description?: string };
  const defaults = createDefaultMagicItemData();

  return {
    itemType: data.itemType ?? defaults.itemType,
    rarity: data.rarity ?? defaults.rarity,
    requiresAttunement: data.requiresAttunement ?? defaults.requiresAttunement,
    weightLb: data.weightLb ?? defaults.weightLb,
    valueGp: data.valueGp ?? defaults.valueGp,
    // Old records stored a single "description" field — fold it into mechanicalText.
    flavorText: data.flavorText ?? defaults.flavorText,
    mechanicalText: data.mechanicalText ?? data.description ?? defaults.mechanicalText,
    hasCharges: data.hasCharges ?? defaults.hasCharges,
    charges: { ...defaults.charges, ...data.charges },
    hasDamage: data.hasDamage ?? defaults.hasDamage,
    damage: { ...defaults.damage, ...data.damage }
  };
}
