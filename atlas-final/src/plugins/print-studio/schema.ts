import type { AssetSchema } from "@app/plugin-api/types";

export const PRINT_STUDIO_TYPE = "print-layout";

export type PageSize = "letter" | "legal" | "tabloid" | "a3" | "a4" | "a5" | "a6";
export type PageOrientation = "portrait" | "landscape";
export type MultiCardColumns = 1 | 2 | 3;

export const PAGE_DIMENSIONS_IN: Record<PageSize, { widthIn: number; heightIn: number }> = {
  letter: { widthIn: 8.5, heightIn: 11 },
  legal: { widthIn: 8.5, heightIn: 14 },
  tabloid: { widthIn: 11, heightIn: 17 },
  a3: { widthIn: 297 / 25.4, heightIn: 420 / 25.4 },
  a4: { widthIn: 210 / 25.4, heightIn: 297 / 25.4 },
  a5: { widthIn: 148 / 25.4, heightIn: 210 / 25.4 },
  a6: { widthIn: 105 / 25.4, heightIn: 148 / 25.4 }
};

export const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  letter: "US Letter",
  legal: "US Legal",
  tabloid: "Tabloid / Ledger",
  a3: "A3",
  a4: "A4",
  a5: "A5",
  a6: "A6"
};

export function getPageDimensionsIn(pageSize: PageSize, orientation: PageOrientation = "portrait") {
  const dimensions = PAGE_DIMENSIONS_IN[pageSize];
  return orientation === "landscape"
    ? { widthIn: dimensions.heightIn, heightIn: dimensions.widthIn }
    : dimensions;
}

/** A single card placed on a page. Position/size are in inches for print accuracy. */
export interface CardPlacement {
  id: string;
  assetType: string;
  assetId: string;
  name: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  rotationDeg: number;
  /**
   * Which page of the asset's rendered card to show, for asset types that
   * support renderCardToCanvases (multi-card content, e.g. a creature
   * whose stat block spans several cards). 0 for the first/only card.
   * Undefined is equivalent to 0 and covers asset types that only
   * implement the single-canvas renderCardToCanvas.
   */
  cardPageIndex?: number;
  /** Component-backed cards use componentStore instead of the assets table. */
  sourceKind?: "asset" | "component";
  componentType?: string;
}

export interface PrintPage {
  id: string;
  placements: CardPlacement[];
}

export interface PrintLayoutData {
  pageSize: PageSize;
  /** Missing values in layouts saved before orientation support mean portrait. */
  orientation?: PageOrientation;
  /** Number of columns used when a card renderer returns multiple panels. */
  multiCardColumns?: MultiCardColumns;
  pages: PrintPage[];
}

/** Changes page settings without changing any per-page card arrangement. */
export function withPageSettings(
  data: PrintLayoutData,
  pageSize: PageSize,
  orientation: PageOrientation = data.orientation ?? "portrait"
): PrintLayoutData {
  return { ...data, pageSize, orientation };
}

export const printStudioSchema: AssetSchema = {
  fields: [
    { key: "pageSize", label: "Page Size", type: "enum", required: true, options: Object.keys(PAGE_DIMENSIONS_IN) },
    { key: "orientation", label: "Orientation", type: "enum", required: true, options: ["portrait", "landscape"] }
  ]
};

export function createPage(): PrintPage {
  return { id: crypto.randomUUID(), placements: [] };
}

export function createDefaultPrintLayoutData(): PrintLayoutData {
  return {
    pageSize: "letter",
    orientation: "portrait",
    multiCardColumns: 1,
    pages: [createPage()]
  };
}
