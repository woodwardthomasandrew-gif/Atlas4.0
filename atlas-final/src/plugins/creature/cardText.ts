import { describeDamage } from "@plugins/shared/damage";
import {
  abilityModifier,
  formatModifier,
  resolveExperience,
  resolvePassivePerception,
  type CreatureAbilityEntry,
  type CreatureData,
  type CreatureSize
} from "./schema";

export { describeDamage };

export function sizeLabel(size: CreatureSize): string {
  return size.charAt(0).toUpperCase() + size.slice(1);
}

export function formatSpeedLine(data: CreatureData): string {
  const { speed } = data;
  const parts = [`${speed.walk} ft.`];
  if (speed.climb > 0) parts.push(`climb ${speed.climb} ft.`);
  if (speed.fly > 0) parts.push(`fly ${speed.fly} ft.`);
  if (speed.swim > 0) parts.push(`swim ${speed.swim} ft.`);
  if (speed.burrow > 0) parts.push(`burrow ${speed.burrow} ft.`);
  return parts.join(", ");
}

export function formatAbilityLine(data: CreatureData): string {
  const { abilities } = data;
  const keys: Array<[string, number]> = [
    ["STR", abilities.str],
    ["DEX", abilities.dex],
    ["CON", abilities.con],
    ["INT", abilities.int],
    ["WIS", abilities.wis],
    ["CHA", abilities.cha]
  ];
  return keys
    .map(([label, score]) => `${label} ${score} (${formatModifier(abilityModifier(score))})`)
    .join("  ");
}

export function formatSensesLine(data: CreatureData): string {
  const { senses } = data;
  const parts: string[] = [];
  if (!senses.darkvision.auto && senses.darkvision.value > 0) {
    parts.push(`darkvision ${senses.darkvision.value} ft.`);
  }
  if (!senses.blindsight.auto && senses.blindsight.value > 0) {
    parts.push(`blindsight ${senses.blindsight.value} ft.`);
  }
  if (!senses.tremorsense.auto && senses.tremorsense.value > 0) {
    parts.push(`tremorsense ${senses.tremorsense.value} ft.`);
  }
  if (!senses.truesight.auto && senses.truesight.value > 0) {
    parts.push(`truesight ${senses.truesight.value} ft.`);
  }
  parts.push(`passive Perception ${resolvePassivePerception(data)}`);
  return parts.join(", ");
}

export function formatCrLine(data: CreatureData): string {
  return `CR ${data.challengeRating} (${resolveExperience(data).toLocaleString()} XP)`;
}

export function formatAbilityEntry(entry: CreatureAbilityEntry): string {
  const bits: string[] = [];
  if (entry.attackBonus !== null) bits.push(`to hit ${formatModifier(entry.attackBonus)}`);
  if (entry.saveDC !== null) bits.push(`DC ${entry.saveDC}`);
  if (entry.damage) bits.push(describeDamage(entry.damage));
  if (entry.extraAttacksCount !== null && entry.extraAttacksCount > 1) {
    bits.push(`${entry.extraAttacksCount} attacks`);
  }
  const stat = bits.length > 0 ? ` (${bits.join(", ")})` : "";
  return `${entry.name}${stat}. ${entry.description}`.trim();
}
