import type { ComponentType } from "react";

/**
 * Atlas Plugin API
 * ================
 * Core knows nothing about creatures, spells, items, or any other
 * concrete asset type. Future asset types are implemented as plugins
 * that satisfy these interfaces and register themselves with the
 * asset registry (see @app/registry/assetRegistry.ts).
 *
 * Nothing in this file should ever need to change to support a new
 * asset type — if it does, the abstraction has leaked.
 */

/** A single field in an asset's structured schema. */
export interface AssetSchemaField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "enum" | "text" | "reference" | "list";
  required?: boolean;
  options?: string[];
}

/** Describes the shape of a plugin's asset data. */
export interface AssetSchema {
  fields: AssetSchemaField[];
}

/** Result of validating an asset's data against its schema/rules. */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field?: string; message: string }>;
}

/** Props passed to a plugin-supplied editor component. */
export interface AssetEditorProps<TData = unknown> {
  assetId: string | null;
  data: TData;
  onChange: (data: TData) => void;
}

/** Props passed to a plugin-supplied preview component. */
export interface AssetPreviewProps<TData = unknown> {
  data: TData;
}

/** A single export target a plugin makes available for its asset type. */
export interface AssetExporter<TData = unknown> {
  id: string;
  label: string;
  fileExtension: string;
  export: (data: TData, name: string) => Promise<string | Uint8Array>;
}

/**
 * The full contract an asset-type plugin implements. A plugin registers
 * one AssetTypeDefinition per asset type (e.g. "creature", "item").
 */
export interface AssetTypeDefinition<TData = unknown> {
  /** Stable, unique identifier, e.g. "creature". */
  type: string;
  /** Human-readable name, e.g. "Creature". */
  label: string;
  /** Plural label for lists/navigation, e.g. "Creatures". */
  pluralLabel: string;
  schema: AssetSchema;
  editor: ComponentType<AssetEditorProps<TData>>;
  preview: ComponentType<AssetPreviewProps<TData>>;
  validate: (data: TData) => ValidationResult;
  exporters: AssetExporter<TData>[];
  createDefaultData: () => TData;
}
