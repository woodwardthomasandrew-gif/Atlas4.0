import { validateHandout } from "./schema";
import type { ValidationResult } from "@app/plugin-api/types";
export function validateHandoutData(value: unknown): ValidationResult {
  const result = validateHandout(value);
  return { valid: result.valid, errors: result.errors.map((message) => ({ message })) };
}
