import type { ValidationResult } from "@app/plugin-api/types";
import type { CreatureData } from "./schema";

export function validateCreature(data: CreatureData): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  if (!data.creatureType || data.creatureType.trim().length === 0) {
    errors.push({ field: "creatureType", message: "Creature type is required." });
  }

  if (!data.alignment || data.alignment.trim().length === 0) {
    errors.push({ field: "alignment", message: "Alignment is required." });
  }

  if (!Number.isFinite(data.armorClass) || data.armorClass <= 0) {
    errors.push({ field: "armorClass", message: "Armor class must be greater than 0." });
  }

  if (!Number.isFinite(data.hitPoints) || data.hitPoints <= 0) {
    errors.push({ field: "hitPoints", message: "Hit points must be greater than 0." });
  }

  if (data.experienceMode === "manual" && data.experienceManualValue < 0) {
    errors.push({ field: "experienceManualValue", message: "Manual experience cannot be negative." });
  }

  if (data.senses.passivePerception.auto === false && data.senses.passivePerception.value < 0) {
    errors.push({ field: "senses.passivePerception", message: "Passive perception cannot be negative." });
  }

  if (data.spellcasting.enabled && data.spellcasting.saveDC <= 0) {
    errors.push({ field: "spellcasting.saveDC", message: "Spellcasting save DC must be greater than 0." });
  }

  if (data.innateSpellcasting.enabled && data.innateSpellcasting.saveDC <= 0) {
    errors.push({
      field: "innateSpellcasting.saveDC",
      message: "Innate spellcasting save DC must be greater than 0."
    });
  }

  for (const entry of data.lootTable) {
    if (entry.quantityMin > entry.quantityMax) {
      errors.push({
        field: `lootTable.${entry.id}`,
        message: `Loot entry "${entry.name || "unnamed"}" has a min quantity greater than its max.`
      });
    }
    if (entry.dropChancePercent < 0 || entry.dropChancePercent > 100) {
      errors.push({
        field: `lootTable.${entry.id}`,
        message: `Loot entry "${entry.name || "unnamed"}" drop chance must be between 0 and 100.`
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
