import type { ValidationResult } from "@app/plugin-api/types";
import type { MagicItemData } from "./schema";

export function validateMagicItem(data: MagicItemData): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  if (!data.itemType || data.itemType.trim().length === 0) {
    errors.push({ field: "itemType", message: "Item type is required." });
  }

  if (!data.mechanicalText || data.mechanicalText.trim().length === 0) {
    errors.push({ field: "mechanicalText", message: "Mechanical text is required." });
  }

  if (data.weightLb < 0) {
    errors.push({ field: "weightLb", message: "Weight cannot be negative." });
  }

  if (data.valueGp < 0) {
    errors.push({ field: "valueGp", message: "Value cannot be negative." });
  }

  if (data.hasCharges) {
    if (!Number.isFinite(data.charges.max) || data.charges.max <= 0) {
      errors.push({ field: "charges.max", message: "Max charges must be greater than 0." });
    }
    if (!Number.isFinite(data.charges.current) || data.charges.current < 0) {
      errors.push({ field: "charges.current", message: "Current charges cannot be negative." });
    }
    if (data.charges.current > data.charges.max) {
      errors.push({
        field: "charges.current",
        message: "Current charges cannot exceed max charges."
      });
    }
  }

  if (data.hasDamage) {
    if (!Number.isFinite(data.damage.diceCount) || data.damage.diceCount <= 0) {
      errors.push({ field: "damage.diceCount", message: "Damage dice count must be at least 1." });
    }
  }

  return { valid: errors.length === 0, errors };
}
