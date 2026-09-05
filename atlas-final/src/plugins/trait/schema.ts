import { DAMAGE_DIE_TYPES, DAMAGE_TYPES, type ItemDamage } from "@plugins/shared/damage";

export const TRAIT_STUDIO_PATH = "/traits";

export const TRAIT_STUDIO_TYPES = [
  "trait",
  "action",
  "bonusAction",
  "reaction",
  "legendaryAction",
  "lairAction",
  "mythicAction"
] as const;

export type TraitStudioType = (typeof TRAIT_STUDIO_TYPES)[number];

export interface TraitMechanics {
  attackBonus: number | null;
  damage: ItemDamage | null;
  saveDC: number | null;
  extraAttacksCount: number | null;
}

export function emptyTraitMechanics(): TraitMechanics {
  return { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null };
}

export function normalizeTraitMechanics(raw: unknown): TraitMechanics {
  const value = (raw ?? {}) as Partial<TraitMechanics>;
  const damage = value.damage as Partial<ItemDamage> | null | undefined;
  return {
    attackBonus: typeof value.attackBonus === "number" ? value.attackBonus : null,
    saveDC: typeof value.saveDC === "number" ? value.saveDC : null,
    extraAttacksCount: typeof value.extraAttacksCount === "number" ? value.extraAttacksCount : null,
    damage:
      damage && typeof damage === "object"
        ? {
            diceCount: typeof damage.diceCount === "number" ? damage.diceCount : 1,
            diceType: DAMAGE_DIE_TYPES.includes(damage.diceType as (typeof DAMAGE_DIE_TYPES)[number])
              ? (damage.diceType as ItemDamage["diceType"])
              : "d6",
            bonus: typeof damage.bonus === "number" ? damage.bonus : 0,
            damageType: DAMAGE_TYPES.includes(damage.damageType as (typeof DAMAGE_TYPES)[number])
              ? (damage.damageType as ItemDamage["damageType"])
              : "slashing"
          }
        : null
  };
}
