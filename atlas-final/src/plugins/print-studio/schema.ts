import type { AssetSchema } from "@app/plugin-api/types";

export const PRINT_STUDIO_TYPE = "print-layout";

export type PageSize = "letter" | "a4";

export const PAGE_DIMENSIONS_IN: Record<PageSize, { widthIn: number; heightIn: number }> = {
  letter: { widthIn: 8.5, heightIn: 11 },
  a4: { widthIn: 8.27, heightIn: 11.69 }
};

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
}

export interface PrintPage {
  id: string;
  placements: CardPlacement[];
}

export interface PrintLayoutData {
  pageSize: PageSize;
  pages: PrintPage[];
}

export const printStudioSchema: AssetSchema = {
  fields: [{ key: "pageSize", label: "Page Size", type: "enum", required: true, options: ["letter", "a4"] }]
};

export function createPage(): PrintPage {
  return { id: crypto.randomUUID(), placements: [] };
}

export function createDefaultPrintLayoutData(): PrintLayoutData {
  return {
    pageSize: "letter",
    pages: [createPage()]
  };
}
