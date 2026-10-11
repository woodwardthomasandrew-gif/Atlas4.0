/** Shared catalogue for reusable starting data. Templates are resources, never asset rows. */
export interface AssetTemplate<TData = unknown> {
  id: string;
  name: string;
  /** Optional initial name for the asset created from this catalogue entry. */
  defaultAssetName?: string;
  description: string;
  assetType: string;
  category: string;
  tags?: readonly string[];
  ruleset?: string;
  sourceNotes?: string;
  schemaVersion: number;
  initialData: TData;
  validate?: (data: TData) => boolean;
  refreshNestedIds?: (data: TData, createId: () => string) => TData;
}

const templates = new Map<string, AssetTemplate<any>>();

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

export function registerAssetTemplates(definitions: readonly AssetTemplate<any>[]): void {
  for (const definition of definitions) {
    if (!definition.id || !definition.name || !definition.assetType || !Number.isInteger(definition.schemaVersion)) {
      throw new Error("Template definition is missing required metadata.");
    }
    const existing = templates.get(definition.id);
    if (existing && existing !== definition) {
      throw new Error(`Template id is already registered: ${definition.id}`);
    }
    deepFreeze(definition.initialData);
    templates.set(definition.id, definition);
  }
}

export function listAssetTemplates(assetType?: string): AssetTemplate[] {
  return [...templates.values()].filter((template) => !assetType || template.assetType === assetType);
}

export function getAssetTemplate(id: string): AssetTemplate | undefined {
  return templates.get(id);
}

/** Clone and validate template data before handing it to an asset maker. */
export function instantiateAssetTemplate<TData = unknown>(
  id: string,
  expectedAssetType: string,
  createId: () => string = () => crypto.randomUUID()
): TData {
  const template = templates.get(id);
  if (!template) throw new Error(`Template not found: ${id}`);
  if (template.assetType !== expectedAssetType) throw new Error(`Template ${id} is not a ${expectedAssetType} template.`);

  let cloned: TData;
  try {
    cloned = JSON.parse(JSON.stringify(template.initialData)) as TData;
  } catch {
    throw new Error(`Template ${id} contains data that cannot be cloned.`);
  }
  let valid = Boolean(cloned && typeof cloned === "object");
  try {
    if (valid && template.validate) valid = template.validate(cloned);
    if (valid && template.refreshNestedIds) cloned = template.refreshNestedIds(cloned, createId);
  } catch {
    valid = false;
  }
  if (!valid) {
    throw new Error(`Template ${id} contains invalid initial data.`);
  }
  return cloned as TData;
}
