import { registerAssetTemplates, type AssetTemplate } from "@app/templates/templateCatalog";
import { createDefaultSpellData, type SpellData } from "./schema";
import { validateSpell } from "./validate";

function spellStartingData(overrides: Partial<SpellData>): SpellData {
  return {
    ...createDefaultSpellData(),
    level: 1,
    school: "evocation",
    castingTime: "1 action",
    range: "30 feet",
    duration: "Instantaneous",
    description: "Customize the target, effect, and any family-specific mechanics.",
    ...overrides
  };
}

const spellTemplates: AssetTemplate<SpellData>[] = [
  {
    id: "spell-damage-foundation",
    name: "Damage Spell",
    defaultAssetName: "Custom Damage Spell",
    description: "A low-level damaging spell foundation with a Dexterity save and editable damage.",
    assetType: "spell",
    category: "Effect foundation",
    tags: ["damage", "level-1", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; not a copy of an official spell.",
    schemaVersion: 1,
    initialData: spellStartingData({
      range: "60 feet",
      description: "A damaging magical effect strikes a target you can see. Customize the target, damage dice and type, and whether this should use a different attack or save mechanic.",
      resolution: "save",
      savingThrowAbility: "dex",
      halfDamageOnSave: true,
      hasDamage: true,
      damage: { diceCount: 2, diceType: "d6", bonus: 0, damageType: "force" }
    }),
    validate: (data) => validateSpell(data).valid
  },
  {
    id: "spell-healing-foundation",
    name: "Healing Spell",
    defaultAssetName: "Custom Healing Spell",
    description: "A low-level touch healing spell with an editable amount and target.",
    assetType: "spell",
    category: "Effect foundation",
    tags: ["healing", "level-1", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; not a copy of an official spell.",
    schemaVersion: 1,
    initialData: spellStartingData({
      school: "evocation",
      range: "Touch",
      description: "A creature you touch regains hit points. Customize the eligible target and healing amount; the starting amount is a placeholder for balance work.",
      hasHealing: true,
      healing: { diceCount: 2, diceType: "d8", bonus: 0, damageType: "radiant" }
    }),
    validate: (data) => validateSpell(data).valid
  },
  {
    id: "spell-control-foundation",
    name: "Control Spell",
    defaultAssetName: "Custom Control Spell",
    description: "A low-level single-target control foundation with a Wisdom save and a restrained condition placeholder.",
    assetType: "spell",
    category: "Effect foundation",
    tags: ["control", "condition", "level-1", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; not a copy of an official spell.",
    schemaVersion: 1,
    initialData: spellStartingData({
      school: "enchantment",
      range: "60 feet",
      duration: "Until the end of the target's next turn (customize)",
      concentration: true,
      description: "One target that fails a Wisdom saving throw is restrained until this spell ends. Customize the condition, target restrictions, duration, and any repeat save or escape rules.",
      resolution: "save",
      savingThrowAbility: "wis",
      conditionsApplied: ["restrained"]
    }),
    validate: (data) => validateSpell(data).valid
  },
  {
    id: "spell-utility-foundation",
    name: "Utility Spell",
    defaultAssetName: "Custom Utility Spell",
    description: "A flexible non-damaging cantrip foundation for exploration, information, or practical magic.",
    assetType: "spell",
    category: "Effect foundation",
    tags: ["utility", "cantrip", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; not a copy of an official spell.",
    schemaVersion: 1,
    initialData: spellStartingData({
      level: 0,
      school: "transmutation",
      range: "30 feet",
      duration: "1 minute",
      description: "Describe a practical magical effect for exploration, information gathering, or a mundane task. Customize the effect, target, and limits."
    }),
    validate: (data) => validateSpell(data).valid
  },
  {
    id: "spell-summoning-foundation",
    name: "Summoning Spell",
    defaultAssetName: "Custom Summoning Spell",
    description: "A summoning foundation with editable entity and duration details; it does not create a linked creature asset.",
    assetType: "spell",
    category: "Effect foundation",
    tags: ["summoning", "conjuration", "blank"],
    ruleset: "D&D 5e (2014 conventions); generic homebrew foundation",
    sourceNotes: "Original template; not a copy of an official spell.",
    schemaVersion: 1,
    initialData: spellStartingData({
      school: "conjuration",
      range: "30 feet",
      duration: "1 minute",
      concentration: true,
      description: "You summon or create a creature or entity in an unoccupied space within range. Customize what appears, its statistics and behavior, the number summoned, and how it ends. This spell does not create or link a Creature Maker asset."
    }),
    validate: (data) => validateSpell(data).valid
  }
];

export function registerSpellTemplates(): void {
  registerAssetTemplates(spellTemplates);
}

export { spellTemplates };
