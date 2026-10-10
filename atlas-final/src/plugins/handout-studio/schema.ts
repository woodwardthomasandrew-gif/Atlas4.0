import type { AssetSchema } from "@app/plugin-api/types";

export const HANDOUT_TYPE = "handout";
export const HANDOUT_ART_TYPE = "handout-artwork";
export const HANDOUT_SCHEMA_VERSION = 1;
export const PX_PER_IN = 96;
export const ptToPx = (pt: number): number => pt * (PX_PER_IN / 72);
export const pxToPt = (px: number): number => px * (72 / PX_PER_IN);
export const INCH_PRESETS = {
  Letter: [8.5, 11], Legal: [8.5, 14], Tabloid: [11, 17],
  A3: [297 / 25.4, 420 / 25.4], A4: [210 / 25.4, 297 / 25.4],
  A5: [148 / 25.4, 210 / 25.4], A6: [105 / 25.4, 148 / 25.4]
} as const;

export type HandoutElement = {
  id: string; type: "text" | "rect" | "ellipse" | "line" | "image";
  x: number; y: number; width: number; height: number; rotation: number;
  opacity: number; visible: boolean; locked: boolean;
  text?: string; fontFamily?: string; fontSize?: number; fontWeight?: string;
  italic?: boolean; align?: "left" | "center" | "right"; lineHeight?: number; color?: string;
  fill?: string; stroke?: string; strokeWidth?: number; artworkId?: string; fit?: "contain" | "cover";
};
export type HandoutPage = { id: string; widthIn: number; heightIn: number; background: string; elements: HandoutElement[]; texture?: "none" | "parchment" | "aged" };
export type HandoutData = { schemaVersion: 1; templateId?: string; pages: HandoutPage[] };
export const handoutSchema: AssetSchema = { fields: [{ key: "pages", label: "Pages", type: "list", required: true }] };
export const createPage = (widthIn = 8.5, heightIn = 11): HandoutPage => ({ id: crypto.randomUUID(), widthIn, heightIn, background: "#fffdf6", elements: [], texture: "none" });
export const createHandout = (): HandoutData => ({ schemaVersion: HANDOUT_SCHEMA_VERSION, pages: [createPage()] });
export function validateHandout(value: unknown): { valid: boolean; errors: string[] } {
  if (!value || typeof value !== "object") return { valid: false, errors: ["Document is not an object."] };
  const data = value as Partial<HandoutData>;
  if (data.schemaVersion !== HANDOUT_SCHEMA_VERSION) return { valid: false, errors: [`Unsupported handout schema version: ${String(data.schemaVersion)}.`] };
  if (!Array.isArray(data.pages) || data.pages.length < 1) return { valid: false, errors: ["A handout must contain at least one page."] };
  const errors: string[] = [], ids = new Set<string>();
  data.pages.forEach((page, index) => {
    if (!page?.id || ids.has(page.id)) errors.push(`Page ${index + 1} has a missing or duplicate ID.`); else ids.add(page.id);
    if (!page || !Number.isFinite(page.widthIn) || !Number.isFinite(page.heightIn) || page.widthIn <= 0 || page.heightIn <= 0 || page.widthIn > 200 || page.heightIn > 200) errors.push(`Page ${index + 1} has invalid dimensions.`);
    if (!Array.isArray(page?.elements)) errors.push(`Page ${index + 1} has invalid elements.`);
    else for (const element of page.elements) {
      if (!element.id || ids.has(element.id) || !["text", "rect", "ellipse", "line", "image"].includes(element.type) || ![element.x, element.y, element.width, element.height, element.rotation, element.opacity].every(Number.isFinite)) errors.push(`Page ${index + 1} contains an invalid element.`);
      else ids.add(element.id);
      if (element.type === "image" && !element.artworkId) errors.push(`Page ${index + 1} has an image without an artwork reference.`);
      if (element.type === "text" && typeof element.text !== "string") errors.push(`Page ${index + 1} has a text element without text content.`);
    }
  });
  return { valid: errors.length === 0, errors };
}
