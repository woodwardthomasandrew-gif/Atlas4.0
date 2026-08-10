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
  name: string;
  data: TData;
}

/** A single export target a plugin makes available for its asset type. */
export interface AssetExporter<TData = unknown> {
  id: string;
  label: string;
  fileExtension: string;
  export: (data: TData, name: string) => Promise<string | Uint8Array>;
}

/** Default physical size, in inches, a card for this asset type should be placed at. */
export interface CardSize {
  widthIn: number;
  heightIn: number;
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
  /**
   * Optional: draws this asset's card onto the given canvas, sizing the
   * canvas itself to fit the content (content-driven asset types, like
   * creature stat blocks, vary in height). Consumers must read the
   * canvas's resulting width/height after calling this rather than
   * assuming `cardSize` — that's only a starting/default size. Asset
   * types that don't supply this simply can't be placed in Print Studio
   * layouts.
   */
  renderCardToCanvas?: (canvas: HTMLCanvasElement, name: string, data: TData) => void;
  /**
   * Optional: like renderCardToCanvas, but for asset types whose content
   * can exceed a single printable card (e.g. a creature with a very long
   * stat block). Returns one canvas per physical card, in order, with
   * continuation cards visually marked (e.g. "Name (cont.)"). Consumers
   * that support multi-card placement (Print Studio) should prefer this
   * over renderCardToCanvas when present; the first canvas in the
   * returned array is equivalent to what renderCardToCanvas would draw
   * when content fits on one card.
   */
  renderCardToCanvases?: (name: string, data: TData) => HTMLCanvasElement[];
  /** Default/starting placement size for this asset type's card, in inches. Required if renderCardToCanvas is set. Actual placement height should be derived from the rendered canvas's real aspect ratio, not assumed to equal this. */
  cardSize?: CardSize;
}
