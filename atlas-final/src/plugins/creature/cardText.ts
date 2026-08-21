import { describeDamage } from "@plugins/shared/damage";
import {
  abilityModifier,
  formatModifier,
  resolveExperience,
  resolvePassivePerception,
  type LootTableEntry,
  type CreatureAbilityEntry,
  type CreatureData,
  type SpellcastingBlock,
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

/** One line per equipment entry, e.g. "Longsword (x1) - masterwork". */
export function formatEquipmentEntry(entry: { name: string; quantity: string; notes: string }): string {
  const qty = entry.quantity.trim() ? ` (${entry.quantity.trim()})` : "";
  const notes = entry.notes.trim() ? ` - ${entry.notes.trim()}` : "";
  return `${entry.name}${qty}${notes}`.trim();
}

export function formatSpellcastingBody(block: SpellcastingBlock): string[] {
  if (!block.enabled) return [];

  const lines: string[] = [
    `${block.ability.toUpperCase()} spellcasting, save DC ${block.saveDC}, ${formatModifier(
      block.attackBonus
    )} to hit with spell attacks.`
  ];

  if (block.freeformNotes.trim().length > 0) {
    lines.push(block.freeformNotes.trim());
  }

  for (const group of groupSpellsByLevel(block.spellRefs)) {
    lines.push(`${group.label}:`);
    for (const name of group.names) {
      lines.push(`- ${name}`);
    }
  }

  return lines;
}

export function formatLootTableEntry(entry: LootTableEntry): string {
  const quantity =
    entry.quantityMin === entry.quantityMax
      ? `x${entry.quantityMin}`
      : `x${entry.quantityMin}-${entry.quantityMax}`;
  const chance = `${entry.dropChancePercent}%`;
  const notes = entry.notes.trim() ? ` - ${entry.notes.trim()}` : "";
  return `${entry.name} (${quantity}, ${chance})${notes}`.trim();
}

export function formatStringList(title: string, values: string[]): string[] {
  if (values.length === 0) return [];
  return [`${title}: ${values.join(", ")}`];
}

const SPELL_LEVEL_LABELS: Record<number, string> = {
  0: "Cantrips",
  1: "1st Level",
  2: "2nd Level",
  3: "3rd Level",
  4: "4th Level",
  5: "5th Level",
  6: "6th Level",
  7: "7th Level",
  8: "8th Level",
  9: "9th Level"
};

export function spellLevelLabel(level: number): string {
  return SPELL_LEVEL_LABELS[level] ?? `Level ${level}`;
}

/**
 * Groups spell references by stored level (cantrips first, then ascending),
 * with names sorted alphabetically within each level group.
 */
export function groupSpellsByLevel(
  spellRefs: Array<{ name: string; level: number }>
): Array<{ level: number; label: string; names: string[] }> {
  const byLevel = new Map<number, string[]>();
  for (const ref of spellRefs) {
    const list = byLevel.get(ref.level) ?? [];
    list.push(ref.name);
    byLevel.set(ref.level, list);
  }
  return Array.from(byLevel.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, names]) => ({
      level,
      label: spellLevelLabel(level),
      names: [...names].sort((a, b) => a.localeCompare(b))
    }));
}
