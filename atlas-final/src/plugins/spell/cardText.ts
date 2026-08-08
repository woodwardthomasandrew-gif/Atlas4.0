import { describeDamage } from "@plugins/shared/damage";
import { formatLevelSchoolLine, type AreaOfEffect, type SpellComponents, type SpellData } from "./schema";

export { describeDamage, formatLevelSchoolLine };

export function formatComponentsLine(components: SpellComponents): string {
  const letters: string[] = [];
  if (components.verbal) letters.push("V");
  if (components.somatic) letters.push("S");
  if (components.material) letters.push("M");
  const material = components.material ? ` (${components.materialDescription})` : "";
  return `${letters.join(", ")}${material}`;
}

export function formatAreaOfEffect(area: AreaOfEffect): string | null {
  if (area.shape === "none" || area.sizeFt <= 0) return null;
  return `${area.sizeFt}-foot ${area.shape}`;
}

export function formatResolutionLine(data: SpellData): string | null {
  if (data.resolution === "attack") {
    return "Spell attack roll";
  }
  if (data.resolution === "save") {
    const ability = data.savingThrowAbility.toUpperCase();
    const half = data.halfDamageOnSave ? " (half damage on a success)" : "";
    return `${ability} saving throw${half}`;
  }
  return null;
}

export function formatDamageHealingLine(data: SpellData): string | null {
  const parts: string[] = [];
  if (data.hasDamage) parts.push(describeDamage(data.damage));
  if (data.hasHealing) parts.push(`heals ${describeDamage(data.healing).replace(" damage", "")}`);
  return parts.length > 0 ? parts.join("; ") : null;
}
