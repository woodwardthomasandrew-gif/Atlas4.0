import { registerAssetTemplates, type AssetTemplate } from "@app/templates/templateCatalog";
import { createDefaultMagicItemData, type MagicItemData } from "./schema";
import { validateMagicItem } from "./validate";

const itemTemplates: AssetTemplate<MagicItemData>[] = [
  {
    id: "magic-item-weapon-foundation",
    name: "Magic Weapon",
    defaultAssetName: "Custom Magic Weapon",
    description: "A neutral weapon foundation with no assumed weapon type, bonus, or damage mechanic.",
    assetType: "magic-item",
    category: "Equipment foundation",
    tags: ["weapon", "equipment", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; customize to the intended item and campaign.",
    schemaVersion: 1,
    initialData: {
      ...createDefaultMagicItemData(),
      itemType: "Weapon (customize type)",
      mechanicalText: "Customize the weapon type, properties, magical bonuses, and special effects. No bonus or special mechanic is assumed."
    },
    validate: (data) => validateMagicItem(data).valid
  },
  {
    id: "magic-item-armour-foundation",
    name: "Magic Armour",
    defaultAssetName: "Custom Magic Armour",
    description: "A neutral armour foundation without an assumed armour category, bonus, defensive effect, or proficiency grant.",
    assetType: "magic-item",
    category: "Equipment foundation",
    tags: ["armour", "equipment", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; customize to the intended item and campaign.",
    schemaVersion: 1,
    initialData: {
      ...createDefaultMagicItemData(),
      itemType: "Armour (customize category)",
      mechanicalText: "Customize the armour category and any magical effect. No AC bonus, defensive mechanic, or armour proficiency is granted by this template."
    },
    validate: (data) => validateMagicItem(data).valid
  },
  {
    id: "magic-item-wondrous-foundation",
    name: "Wondrous Item",
    defaultAssetName: "Custom Wondrous Item",
    description: "A flexible foundation for a ring, amulet, tool, device, or other unusual item.",
    assetType: "magic-item",
    category: "General foundation",
    tags: ["wondrous", "flexible", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; customize to the intended item and campaign.",
    schemaVersion: 1,
    initialData: {
      ...createDefaultMagicItemData(),
      itemType: "Wondrous item (customize form)",
      mechanicalText: "Customize the item's form, activation method, and mechanical effect. Charges, damage, and attunement are optional choices."
    },
    validate: (data) => validateMagicItem(data).valid
  },
  {
    id: "magic-item-consumable-foundation",
    name: "Consumable",
    defaultAssetName: "Custom Consumable",
    description: "A one-use foundation for a potion, scroll-like object, expendable device, or other consumable.",
    assetType: "magic-item",
    category: "Use-limited foundation",
    tags: ["consumable", "one-use", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; customize to the intended item and campaign.",
    schemaVersion: 1,
    initialData: {
      ...createDefaultMagicItemData(),
      itemType: "Consumable (customize form)",
      mechanicalText: "One-use foundation. Customize how it is activated, its target or area, exact effect, and what happens when it is used. The item schema does not track consumption."
    },
    validate: (data) => validateMagicItem(data).valid
  },
  {
    id: "magic-item-charged-foundation",
    name: "Charged Item",
    defaultAssetName: "Custom Charged Item",
    description: "An activated item with a valid five-charge starting pool and editable recharge fields.",
    assetType: "magic-item",
    category: "Use-limited foundation",
    tags: ["charges", "activated", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; recharge fields record the rule but are not enforced automatically.",
    schemaVersion: 1,
    initialData: {
      ...createDefaultMagicItemData(),
      itemType: "Charged item (customize type)",
      mechanicalText: "Customize the activated effect, its target, and the charge cost. Set the recharge formula and timing to suit the item; the maker records these fields but does not enforce recharge rules.",
      hasCharges: true,
      charges: { max: 5, current: 5, rechargeFormula: "", rechargeTiming: "other" }
    },
    validate: (data) => validateMagicItem(data).valid
  }
];

export function registerMagicItemTemplates(): void {
  registerAssetTemplates(itemTemplates);
}

export { itemTemplates };
