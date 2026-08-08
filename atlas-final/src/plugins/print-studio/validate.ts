import type { ValidationResult } from "@app/plugin-api/types";
import type { PrintLayoutData } from "./schema";

export function validatePrintLayout(data: PrintLayoutData): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  if (data.pages.length === 0) {
    errors.push({ field: "pages", message: "A layout needs at least one page." });
  }

  return { valid: errors.length === 0, errors };
}
