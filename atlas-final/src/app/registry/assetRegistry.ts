import type { AssetTypeDefinition } from "@app/plugin-api/types";

/**
 * Runtime registry of asset-type plugins.
 *
 * Atlas 4.0 ships with zero registered asset types. Future plugins
 * (Creature Builder, Item Builder, etc.) call registerAssetType() during
 * their own initialization. Nothing in core imports a concrete plugin —
 * plugins are discovered and registered externally (see
 * src/app/registry/loadPlugins.ts).
 */

const registry = new Map<string, AssetTypeDefinition>();

export function registerAssetType(definition: AssetTypeDefinition): void {
  if (registry.has(definition.type)) {
    throw new Error(`Asset type "${definition.type}" is already registered.`);
  }
  registry.set(definition.type, definition as AssetTypeDefinition);
}

export function getAssetType(type: string): AssetTypeDefinition | undefined {
  return registry.get(type);
}

export function getAllAssetTypes(): AssetTypeDefinition[] {
  return Array.from(registry.values());
}

export function isAssetTypeRegistered(type: string): boolean {
  return registry.has(type);
}
