import type { ValidationResult } from "@app/plugin-api/types";
import type { SpellData } from "./schema";

export function validateSpell(data: SpellData): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  if (!Number.isFinite(data.level) || data.level < 0 || data.level > 9) {
    errors.push({ field: "level", message: "Level must be between 0 (cantrip) and 9." });
  }

  if (!data.castingTime || data.castingTime.trim().length === 0) {
    errors.push({ field: "castingTime", message: "Casting time is required." });
  }

  if (!data.range || data.range.trim().length === 0) {
    errors.push({ field: "range", message: "Range is required." });
  }

  if (!data.duration || data.duration.trim().length === 0) {
    errors.push({ field: "duration", message: "Duration is required." });
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: "description", message: "Description is required." });
  }

  if (data.components.material && data.components.materialDescription.trim().length === 0) {
    errors.push({
      field: "components.materialDescription",
      message: "Material description is required when the material component is checked."
    });
  }

  if (data.scaling.canUpcast && data.scaling.description.trim().length === 0) {
    errors.push({
      field: "scaling.description",
      message: "Scaling description is required when upcasting is enabled."
    });
  }

  if (data.resolution === "save" && !data.savingThrowAbility) {
    errors.push({ field: "savingThrowAbility", message: "A saving throw ability is required." });
  }

  return { valid: errors.length === 0, errors };
}
