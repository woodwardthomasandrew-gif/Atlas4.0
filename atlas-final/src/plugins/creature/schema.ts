import type { AssetSchema } from "@app/plugin-api/types";
import { createDefaultDamage, type ItemDamage } from "@plugins/shared/damage";
import { abilityModifier, formatModifier, type AbilityKey } from "@plugins/shared/abilities";

export type { AbilityKey };
export { abilityModifier, formatModifier };

export const CREATURE_TYPE = "creature";

export type CreatureSize = "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";

export const CREATURE_SIZES: CreatureSize[] = [
  "tiny",
  "small",
  "medium",
  "large",
  "huge",
  "gargantuan"
];

/** Common 5e-style creature type tags — used as datalist suggestions, not a rigid enum. */
export const COMMON_CREATURE_TYPE_TAGS: string[] = [
  "aberration",
  "beast",
  "celestial",
  "construct",
  "dragon",
  "elemental",
  "fey",
  "fiend",
  "giant",
  "humanoid",
  "monstrosity",
  "ooze",
  "plant",
  "undead"
];

export const COMMON_ALIGNMENTS: string[] = [
  "lawful good",
  "neutral good",
  "chaotic good",
  "lawful neutral",
  "true neutral",
  "chaotic neutral",
  "lawful evil",
  "neutral evil",
  "chaotic evil",
  "unaligned",
  "any alignment"
];

/** Standard challenge ratings, ordered low to high. */
export const CHALLENGE_RATINGS: string[] = [
  "0",
  "1/8",
  "1/4",
  "1/2",
  ...Array.from({ length: 30 }, (_, i) => String(i + 1))
];

/** Standard CR -> XP table (5e DMG). Used for auto-calculated experience. */
export const CR_TO_XP: Record<string, number> = {
  "0": 10,
  "1/8": 25,
  "1/4": 50,
  "1/2": 100,
  "1": 200,
  "2": 450,
  "3": 700,
  "4": 1100,
  "5": 1800,
  "6": 2300,
  "7": 2900,
  "8": 3900,
  "9": 5000,
  "10": 5900,
  "11": 7200,
  "12": 8400,
  "13": 10000,
  "14": 11500,
  "15": 13000,
  "16": 15000,
  "17": 18000,
  "18": 20000,
  "19": 22000,
  "20": 25000,
  "21": 33000,
  "22": 41000,
  "23": 50000,
  "24": 62000,
  "25": 75000,
  "26": 90000,
  "27": 105000,
  "28": 120000,
  "29": 135000,
  "30": 155000
};

export interface CreatureSpeed {
  walk: number;
  climb: number;
  fly: number;
  swim: number;
  burrow: number;
}

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

/** A single named bonus, e.g. a saving throw or skill: { name: "Dexterity", bonus: 5 }. */
export interface NamedBonus {
  name: string;
  bonus: number;
}

/** A sense value with an "auto" toggle — auto means derived/none, override means a manual value applies. */
export interface SenseValue {
  auto: boolean;
  value: number;
}

export function createDefaultSenseValue(): SenseValue {
  return { auto: true, value: 0 };
}

export interface CreatureSenses {
  passivePerception: SenseValue;
  darkvision: SenseValue;
  blindsight: SenseValue;
  tremorsense: SenseValue;
  truesight: SenseValue;
}

/**
 * A single traits/actions-style entry. Description is always free text (so
 * it reads like a real stat block), but attackBonus/damage/saveDC/
 * extraAttacksCount are optional structured fields specifically so a future
 * CR estimator can read them directly instead of parsing prose.
 */
export interface CreatureAbilityEntry {
  id: string;
  name: string;
  description: string;
  attackBonus: number | null;
  damage: ItemDamage | null;
  saveDC: number | null;
  extraAttacksCount: number | null;
}

export function createAbilityEntry(): CreatureAbilityEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    attackBonus: null,
    damage: null,
    saveDC: null,
    extraAttacksCount: null
  };
}

export interface SpellReference {
  assetId: string;
  name: string;
}

export interface SpellcastingBlock {
  enabled: boolean;
  ability: AbilityKey;
  saveDC: number;
  attackBonus: number;
  spellRefs: SpellReference[];
  /** Casting stats / at-will-vs-per-day text that doesn't fit neatly into spell references. */
  freeformNotes: string;
}

export function createDefaultSpellcasting(): SpellcastingBlock {
  return {
    enabled: false,
    ability: "int",
    saveDC: 10,
    attackBonus: 0,
    spellRefs: [],
    freeformNotes: ""
  };
}

export type InventoryEntryKind = "reference" | "generic";

export interface EquipmentEntry {
  id: string;
  kind: InventoryEntryKind;
  assetId: string | null;
  name: string;
  quantity: string;
  notes: string;
}

export function createEquipmentEntry(): EquipmentEntry {
  return {
    id: crypto.randomUUID(),
    kind: "generic",
    assetId: null,
    name: "",
    quantity: "",
    notes: ""
  };
}

export interface LootTableEntry extends EquipmentEntry {
  quantityMin: number;
  quantityMax: number;
  dropChancePercent: number;
}

export function createLootTableEntry(): LootTableEntry {
  return {
    ...createEquipmentEntry(),
    quantityMin: 1,
    quantityMax: 1,
    dropChancePercent: 100
  };
}

export interface CreatureData {
  size: CreatureSize;
  creatureType: string;
  alignment: string;
  challengeRating: string;
  experienceMode: "auto" | "manual";
  experienceManualValue: number;

  armorClass: number;
  armorClassNote: string;
  hitPoints: number;
  hitDice: string;
  speed: CreatureSpeed;

  abilities: AbilityScores;

  savingThrows: NamedBonus[];
  skills: NamedBonus[];

  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];

  senses: CreatureSenses;
  languages: string;

  traits: CreatureAbilityEntry[];
  actions: CreatureAbilityEntry[];

  // Advanced / collapsible
  bonusActions: CreatureAbilityEntry[];
  reactions: CreatureAbilityEntry[];
  legendaryActions: CreatureAbilityEntry[];
  lairActions: CreatureAbilityEntry[];
  mythicActions: CreatureAbilityEntry[];
  spellcasting: SpellcastingBlock;
  innateSpellcasting: SpellcastingBlock;
  regionalEffects: string[];
  equipment: EquipmentEntry[];
  lootTable: LootTableEntry[];
  notes: string;
  artworkDataUrl: string;
  tags: string[];
}

export const creatureSchema: AssetSchema = {
  fields: [
    { key: "size", label: "Size", type: "enum", required: true, options: CREATURE_SIZES },
    { key: "creatureType", label: "Creature Type", type: "string", required: true },
    { key: "alignment", label: "Alignment", type: "string", required: true },
    {
      key: "challengeRating",
      label: "Challenge Rating",
      type: "enum",
      required: true,
      options: CHALLENGE_RATINGS
    },
    { key: "armorClass", label: "Armor Class", type: "number", required: true },
    { key: "hitPoints", label: "Hit Points", type: "number", required: true },
    { key: "hitDice", label: "Hit Dice", type: "string" }
  ]
};

function createDefaultSpeed(): CreatureSpeed {
  return { walk: 30, climb: 0, fly: 0, swim: 0, burrow: 0 };
}

function createDefaultAbilities(): AbilityScores {
  return { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
}

function createDefaultSenses(): CreatureSenses {
  return {
    passivePerception: { auto: true, value: 10 },
    darkvision: createDefaultSenseValue(),
    blindsight: createDefaultSenseValue(),
    tremorsense: createDefaultSenseValue(),
    truesight: createDefaultSenseValue()
  };
}

export function createDefaultCreatureData(): CreatureData {
  return {
    size: "medium",
    creatureType: "",
    alignment: "unaligned",
    challengeRating: "0",
    experienceMode: "auto",
    experienceManualValue: 0,

    armorClass: 10,
    armorClassNote: "",
    hitPoints: 1,
    hitDice: "",
    speed: createDefaultSpeed(),

    abilities: createDefaultAbilities(),

    savingThrows: [],
    skills: [],

    damageVulnerabilities: [],
    damageResistances: [],
    damageImmunities: [],
    conditionImmunities: [],

    senses: createDefaultSenses(),
    languages: "",

    traits: [],
    actions: [],

    bonusActions: [],
    reactions: [],
    legendaryActions: [],
    lairActions: [],
    mythicActions: [],
    spellcasting: createDefaultSpellcasting(),
    innateSpellcasting: createDefaultSpellcasting(),
    regionalEffects: [],
    equipment: [],
    lootTable: [],
    notes: "",
    artworkDataUrl: "",
    tags: []
  };
}

export function resolveExperience(data: CreatureData): number {
  if (data.experienceMode === "manual") return data.experienceManualValue;
  return CR_TO_XP[data.challengeRating] ?? 0;
}

export function resolvePassivePerception(data: CreatureData): number {
  if (!data.senses.passivePerception.auto) return data.senses.passivePerception.value;
  const perceptionSkill = data.skills.find((s) => s.name.toLowerCase() === "perception");
  const bonus = perceptionSkill ? perceptionSkill.bonus : abilityModifier(data.abilities.wis);
  return 10 + bonus;
}

/**
 * Backfills fields on records saved by older versions of this schema, so
 * every consumer — editor, preview, card renderer, Print Studio, exporters
 * — can rely on every field always being present and correctly shaped,
 * even records saved before a field existed.
 */
export function normalizeCreatureData(raw: unknown): CreatureData {
  const data = (raw ?? {}) as Partial<CreatureData>;
  const defaults = createDefaultCreatureData();

  const normalizeSense = (value: Partial<SenseValue> | undefined, fallback: SenseValue): SenseValue => ({
    auto: value?.auto ?? fallback.auto,
    value: value?.value ?? fallback.value
  });

  const normalizeSpellcasting = (value: Partial<SpellcastingBlock> | undefined): SpellcastingBlock => ({
    ...createDefaultSpellcasting(),
    ...value,
    spellRefs: value?.spellRefs ?? []
  });

  return {
    size: data.size ?? defaults.size,
    creatureType: data.creatureType ?? defaults.creatureType,
    alignment: data.alignment ?? defaults.alignment,
    challengeRating: data.challengeRating ?? defaults.challengeRating,
    experienceMode: data.experienceMode ?? defaults.experienceMode,
    experienceManualValue: data.experienceManualValue ?? defaults.experienceManualValue,

    armorClass: data.armorClass ?? defaults.armorClass,
    armorClassNote: data.armorClassNote ?? defaults.armorClassNote,
    hitPoints: data.hitPoints ?? defaults.hitPoints,
    hitDice: data.hitDice ?? defaults.hitDice,
    speed: { ...defaults.speed, ...data.speed },

    abilities: { ...defaults.abilities, ...data.abilities },

    savingThrows: data.savingThrows ?? defaults.savingThrows,
    skills: data.skills ?? defaults.skills,

    damageVulnerabilities: data.damageVulnerabilities ?? defaults.damageVulnerabilities,
    damageResistances: data.damageResistances ?? defaults.damageResistances,
    damageImmunities: data.damageImmunities ?? defaults.damageImmunities,
    conditionImmunities: data.conditionImmunities ?? defaults.conditionImmunities,

    senses: {
      passivePerception: normalizeSense(data.senses?.passivePerception, defaults.senses.passivePerception),
      darkvision: normalizeSense(data.senses?.darkvision, defaults.senses.darkvision),
      blindsight: normalizeSense(data.senses?.blindsight, defaults.senses.blindsight),
      tremorsense: normalizeSense(data.senses?.tremorsense, defaults.senses.tremorsense),
      truesight: normalizeSense(data.senses?.truesight, defaults.senses.truesight)
    },
    languages: data.languages ?? defaults.languages,

    traits: data.traits ?? defaults.traits,
    actions: data.actions ?? defaults.actions,

    bonusActions: data.bonusActions ?? defaults.bonusActions,
    reactions: data.reactions ?? defaults.reactions,
    legendaryActions: data.legendaryActions ?? defaults.legendaryActions,
    lairActions: data.lairActions ?? defaults.lairActions,
    mythicActions: data.mythicActions ?? defaults.mythicActions,
    spellcasting: normalizeSpellcasting(data.spellcasting),
    innateSpellcasting: normalizeSpellcasting(data.innateSpellcasting),
    regionalEffects: data.regionalEffects ?? defaults.regionalEffects,
    equipment: data.equipment ?? defaults.equipment,
    lootTable: data.lootTable ?? defaults.lootTable,
    notes: data.notes ?? defaults.notes,
    artworkDataUrl: data.artworkDataUrl ?? defaults.artworkDataUrl,
    tags: data.tags ?? defaults.tags
  };
}

// Re-exported so consumers don't need to import ItemDamage from two places.
export { createDefaultDamage };
export type { ItemDamage };
