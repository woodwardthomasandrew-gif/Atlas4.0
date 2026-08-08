import type { AssetSchema } from "@app/plugin-api/types";
import { createDefaultDamage, type ItemDamage } from "@plugins/shared/damage";
import type { AbilityKey } from "@plugins/shared/abilities";

export const SPELL_TYPE = "spell";

export type SpellSchool =
  | "abjuration"
  | "conjuration"
  | "divination"
  | "enchantment"
  | "evocation"
  | "illusion"
  | "necromancy"
  | "transmutation";

export const SPELL_SCHOOLS: SpellSchool[] = [
  "abjuration",
  "conjuration",
  "divination",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation"
];

/** 0 = cantrip. */
export const SPELL_LEVELS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialDescription: string;
}

export function createDefaultComponents(): SpellComponents {
  return { verbal: true, somatic: true, material: false, materialDescription: "" };
}

export type SpellResolution = "none" | "attack" | "save";

export interface SpellScaling {
  canUpcast: boolean;
  description: string;
}

export function createDefaultScaling(): SpellScaling {
  return { canUpcast: false, description: "" };
}

export type AreaOfEffectShape = "none" | "cone" | "cube" | "cylinder" | "line" | "sphere";

export const AREA_OF_EFFECT_SHAPES: AreaOfEffectShape[] = [
  "none",
  "cone",
  "cube",
  "cylinder",
  "line",
  "sphere"
];

export interface AreaOfEffect {
  shape: AreaOfEffectShape;
  sizeFt: number;
}

export function createDefaultAreaOfEffect(): AreaOfEffect {
  return { shape: "none", sizeFt: 0 };
}

export interface SpellData {
  level: number;
  school: SpellSchool;
  ritual: boolean;
  concentration: boolean;

  castingTime: string;
  range: string;
  components: SpellComponents;
  duration: string;

  description: string;

  // Advanced / collapsible
  scaling: SpellScaling;
  resolution: SpellResolution;
  savingThrowAbility: AbilityKey;
  halfDamageOnSave: boolean;

  hasDamage: boolean;
  damage: ItemDamage;
  hasHealing: boolean;
  healing: ItemDamage;

  areaOfEffect: AreaOfEffect;
  conditionsApplied: string[];
  classes: string[];
  tags: string[];
  artworkDataUrl: string;
  designerNotes: string;
}

export const spellSchema: AssetSchema = {
  fields: [
    { key: "level", label: "Level", type: "number", required: true },
    { key: "school", label: "School", type: "enum", required: true, options: SPELL_SCHOOLS },
    { key: "ritual", label: "Ritual", type: "boolean" },
    { key: "concentration", label: "Concentration", type: "boolean" },
    { key: "castingTime", label: "Casting Time", type: "string", required: true },
    { key: "range", label: "Range", type: "string", required: true },
    { key: "duration", label: "Duration", type: "string", required: true },
    { key: "description", label: "Description", type: "text", required: true }
  ]
};

export function createDefaultSpellData(): SpellData {
  return {
    level: 0,
    school: "evocation",
    ritual: false,
    concentration: false,

    castingTime: "1 action",
    range: "",
    components: createDefaultComponents(),
    duration: "",

    description: "",

    scaling: createDefaultScaling(),
    resolution: "none",
    savingThrowAbility: "dex",
    halfDamageOnSave: false,

    hasDamage: false,
    damage: createDefaultDamage(),
    hasHealing: false,
    healing: createDefaultDamage(),

    areaOfEffect: createDefaultAreaOfEffect(),
    conditionsApplied: [],
    classes: [],
    tags: [],
    artworkDataUrl: "",
    designerNotes: ""
  };
}

export function formatLevelSchoolLine(data: SpellData): string {
  const levelLabel = data.level === 0 ? "Cantrip" : `Level ${data.level}`;
  const ritual = data.ritual ? " (ritual)" : "";
  return `${levelLabel} ${data.school}${ritual}`;
}

/**
 * Backfills fields on records saved by older versions of this schema, so
 * every consumer — editor, preview, card renderer, Print Studio, exporters
 * — can rely on every field always being present and correctly shaped.
 */
export function normalizeSpellData(raw: unknown): SpellData {
  const data = (raw ?? {}) as Partial<SpellData>;
  const defaults = createDefaultSpellData();

  return {
    level: data.level ?? defaults.level,
    school: data.school ?? defaults.school,
    ritual: data.ritual ?? defaults.ritual,
    concentration: data.concentration ?? defaults.concentration,

    castingTime: data.castingTime ?? defaults.castingTime,
    range: data.range ?? defaults.range,
    components: { ...defaults.components, ...data.components },
    duration: data.duration ?? defaults.duration,

    description: data.description ?? defaults.description,

    scaling: { ...defaults.scaling, ...data.scaling },
    resolution: data.resolution ?? defaults.resolution,
    savingThrowAbility: data.savingThrowAbility ?? defaults.savingThrowAbility,
    halfDamageOnSave: data.halfDamageOnSave ?? defaults.halfDamageOnSave,

    hasDamage: data.hasDamage ?? defaults.hasDamage,
    damage: { ...defaults.damage, ...data.damage },
    hasHealing: data.hasHealing ?? defaults.hasHealing,
    healing: { ...defaults.healing, ...data.healing },

    areaOfEffect: { ...defaults.areaOfEffect, ...data.areaOfEffect },
    conditionsApplied: data.conditionsApplied ?? defaults.conditionsApplied,
    classes: data.classes ?? defaults.classes,
    tags: data.tags ?? defaults.tags,
    artworkDataUrl: data.artworkDataUrl ?? defaults.artworkDataUrl,
    designerNotes: data.designerNotes ?? defaults.designerNotes
  };
}
