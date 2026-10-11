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
export type PaperTextureConfig = { version: 1; seed: number; grain: number; ageing: number; water: number; edgeWear: number };
export type HandoutPage = { id: string; widthIn: number; heightIn: number; background: string; elements: HandoutElement[]; texture?: "none" | "parchment" | "aged"; textureConfig?: PaperTextureConfig };
export type HandoutData = { schemaVersion: 1; templateId?: string; pages: HandoutPage[] };
/** Document-space AABB including rotation and half the visible stroke. Coordinates are 96dpi pixels, independent of Fabric's viewport. A 0.01px tolerance absorbs floating-point edge noise only. */
export function elementBounds(element: HandoutElement): { left: number; top: number; right: number; bottom: number } {
  const radians = (element.rotation * Math.PI) / 180;
  const width = Math.abs(element.width * Math.cos(radians)) + Math.abs(element.height * Math.sin(radians));
  const height = Math.abs(element.width * Math.sin(radians)) + Math.abs(element.height * Math.cos(radians));
  const stroke = (element.stroke && element.stroke !== "transparent" ? element.strokeWidth ?? 0 : 0) / 2;
  const cx = element.x + element.width / 2, cy = element.y + element.height / 2;
  return { left: cx - width / 2 - stroke, top: cy - height / 2 - stroke, right: cx + width / 2 + stroke, bottom: cy + height / 2 + stroke };
}
export function isElementOutOfBounds(element: HandoutElement, page: Pick<HandoutPage, "widthIn" | "heightIn">): boolean {
  const b = elementBounds(element), tolerance = 0.01;
  return b.left < -tolerance || b.top < -tolerance || b.right > page.widthIn * PX_PER_IN + tolerance || b.bottom > page.heightIn * PX_PER_IN + tolerance;
}
/** Scale a starter document's document-space placements to the requested physical page size. */
export function fitHandoutToPage<T extends HandoutData>(source: T, widthIn: number, heightIn: number): T {
  const copy = structuredClone(source);
  copy.pages = copy.pages.map(page => resizeHandoutPage(page, widthIn, heightIn));
  return copy;
}
/** Resize a page and its page-relative layout together; invalid transient dimensions leave the page untouched. */
export function resizeHandoutPage(page: HandoutPage, widthIn: number, heightIn: number): HandoutPage {
  if (!Number.isFinite(widthIn) || !Number.isFinite(heightIn) || widthIn <= 0 || heightIn <= 0) return page;
  const sx = widthIn / page.widthIn, sy = heightIn / page.heightIn;
  return { ...page, widthIn, heightIn, elements: page.elements.map(element => ({ ...element, x: element.x * sx, y: element.y * sy, width: element.width * sx, height: element.height * sy, ...(element.fontSize ? { fontSize: element.fontSize * Math.min(sx, sy) } : {}) })) };
}
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
    if (page?.textureConfig && (!Number.isFinite(page.textureConfig.seed) || ![page.textureConfig.grain,page.textureConfig.ageing,page.textureConfig.water,page.textureConfig.edgeWear].every(value => Number.isFinite(value) && value >= 0 && value <= 1) || page.textureConfig.version !== 1)) errors.push(`Page ${index + 1} has invalid paper texture settings.`);
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
