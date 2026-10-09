import { abilityModifier, type AbilityKey } from "@plugins/shared/abilities";
import { averageDamage, type ItemDamage } from "@plugins/shared/damage";
import type { AbilityScores, CreatureData, NamedBonus } from "./schema";

/** Standard 5e proficiency bonus derived from a creature's challenge rating. */
export function proficiencyBonusForChallengeRating(challengeRating: string): number {
  const [numerator, denominator] = challengeRating.split("/").map(Number);
  const numericCr = denominator ? numerator / denominator : Number(challengeRating);
  if (!Number.isFinite(numericCr)) return 2;
  return Math.min(9, Math.max(2, Math.floor((numericCr - 1) / 4) + 2));
}

export function calculateAbilityModifiers(abilities: AbilityScores): Record<AbilityKey, number> {
  return {
    str: abilityModifier(abilities.str),
    dex: abilityModifier(abilities.dex),
    con: abilityModifier(abilities.con),
    int: abilityModifier(abilities.int),
    wis: abilityModifier(abilities.wis),
    cha: abilityModifier(abilities.cha)
  };
}

/** Passive Perception uses a listed Perception skill bonus when present. */
export function calculatePassivePerception(
  wisdomScore: number,
  skills: readonly NamedBonus[],
  manualValue?: number
): number {
  if (manualValue !== undefined) return manualValue;
  const perception = skills.find((skill) => skill.name.toLowerCase() === "perception");
  return 10 + (perception?.bonus ?? abilityModifier(wisdomScore));
}

/** Initiative defaults to the creature's Dexterity modifier in this data model. */
export function calculateInitiative(dexterityScore: number): number {
  return abilityModifier(dexterityScore);
}

/** Average for the structured damage expression used by creature actions. */
export { averageDamage };

/** A read-only calculation snapshot; authored combat bonuses remain authoritative. */
export function calculateCreatureDerivedStats(data: CreatureData) {
  return {
    abilityModifiers: calculateAbilityModifiers(data.abilities),
    proficiencyBonusFromChallengeRating: proficiencyBonusForChallengeRating(data.challengeRating),
    initiative: calculateInitiative(data.abilities.dex),
    passivePerception: calculatePassivePerception(
      data.abilities.wis,
      data.skills,
      data.senses.passivePerception.auto ? undefined : data.senses.passivePerception.value
    )
  };
}

export type { ItemDamage };
