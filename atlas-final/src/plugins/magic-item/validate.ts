import type { ValidationResult } from "@app/plugin-api/types";
import type { MagicItemData } from "./schema";

export function validateMagicItem(data: MagicItemData): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  if (!data.itemType || data.itemType.trim().length === 0) {
    errors.push({ field: "itemType", message: "Item type is required." });
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: "description", message: "Description is required." });
  }

  return { valid: errors.length === 0, errors };
}
