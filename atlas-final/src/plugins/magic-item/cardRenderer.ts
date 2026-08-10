import type { ItemRarity, MagicItemData } from "./schema";
import { normalizeMagicItemData } from "./schema";
import { describeDamage, formatChargesLine } from "./cardText";

const CARD_WIDTH = 600;
const MARGIN = 32;
const CONTENT_WIDTH = CARD_WIDTH - MARGIN * 2;

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: "#6b6c72",
  uncommon: "#4caf50",
  rare: "#5b8def",
  "very-rare": "#9b5bef",
  legendary: "#e5a339",
  artifact: "#e5484d"
};

const BACKGROUND = "#ffffff";
const SURFACE = "#faf8f4";
const TEXT_PRIMARY = "#1c1c1c";
const TEXT_SECONDARY = "#5a5a5a";
const DIVIDER_MUTED = "#d9d4c8";

interface DrawLineOptions {
  font: string;
  color: string;
  maxWidth: number;
  lineHeight: number;
}

/** Wraps text to fit maxWidth and draws it starting at (x, y). Returns the y position after the last line. */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: DrawLineOptions
): number {
  ctx.font = options.font;
  ctx.fillStyle = options.color;
  ctx.textBaseline = "top";

  const paragraphs = text.split("\n");
  let cursorY = y;

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) {
      cursorY += options.lineHeight;
      continue;
    }

    const words = paragraph.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line.length === 0 ? word : `${line} ${word}`;
      const width = ctx.measureText(testLine).width;
      if (width > options.maxWidth && line.length > 0) {
        ctx.fillText(line, x, cursorY);
        cursorY += options.lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line.length > 0) {
      ctx.fillText(line, x, cursorY);
      cursorY += options.lineHeight;
    }
  }

  return cursorY;
}

function drawDivider(ctx: CanvasRenderingContext2D, y: number, color: string, dashed = false): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  if (dashed) ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(CARD_WIDTH - MARGIN, y);
  ctx.stroke();
  ctx.restore();
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
): number {
  ctx.font = "12px sans-serif";
  const paddingX = 10;
  const width = ctx.measureText(text).width + paddingX * 2;
  const height = 22;

  ctx.fillStyle = "rgba(0,0,0,0.04)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, width, height, 11);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + paddingX, y + height / 2 + 1);
  ctx.textBaseline = "top";

  return width;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/** Counts wrapped lines without drawing, using the exact same wrap rule as drawWrappedText. */
function countWrappedLines(ctx: CanvasRenderingContext2D, text: string, font: string, maxWidth: number): number {
  ctx.font = font;
  let lines = 0;
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim().length === 0) {
      lines += 1;
      continue;
    }
    const words = paragraph.split(" ");
    let line = "";
    for (const word of words) {
      const testLine = line.length === 0 ? word : `${line} ${word}`;
      if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
        lines += 1;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line.length > 0) lines += 1;
  }
  return lines;
}

export function renderItemCard(canvas: HTMLCanvasElement, name: string, rawData: MagicItemData): void {
  const data = normalizeMagicItemData(rawData);
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Canvas 2D context is not available.");

  // Measuring pass: content (flavor/mechanical text, charges, damage) is
  // free-form and can run long, so the canvas must be sized to what will
  // actually be drawn rather than a fixed height — a fixed height meant
  // long items simply had their bottom sections drawn off-canvas.
  let measuredY = MARGIN + 8;
  measuredY += 34; // name
  measuredY += 28; // subtitle
  measuredY += 16; // divider gap
  measuredY += 22 + 14; // badges row
  measuredY += 26; // weight/value line
  measuredY += 16; // divider gap

  if (data.flavorText.trim().length > 0) {
    measuredY += countWrappedLines(measureCtx, data.flavorText, "italic 14px serif", CONTENT_WIDTH) * 20;
    measuredY += 12;
  }
  if (data.mechanicalText.trim().length > 0) {
    measuredY += countWrappedLines(measureCtx, data.mechanicalText, "15px sans-serif", CONTENT_WIDTH) * 21;
    measuredY += 12;
  }
  if (data.hasCharges) {
    measuredY += 14 + 18; // divider + "CHARGES" label
    measuredY += countWrappedLines(measureCtx, formatChargesLine(data.charges), "14px sans-serif", CONTENT_WIDTH) * 20;
    measuredY += 8;
  }
  if (data.hasDamage) {
    measuredY += 14 + 18; // divider + "DAMAGE" label
    measuredY += countWrappedLines(measureCtx, describeDamage(data.damage), "14px sans-serif", CONTENT_WIDTH) * 20;
  }
  measuredY += MARGIN;

  const cardHeight = Math.max(measuredY, 380);

  canvas.width = CARD_WIDTH;
  canvas.height = cardHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available.");

  const rarityColor = RARITY_COLORS[data.rarity] ?? TEXT_SECONDARY;

  // Background
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, CARD_WIDTH, cardHeight);

  // Card frame
  ctx.fillStyle = SURFACE;
  roundRect(ctx, 12, 12, CARD_WIDTH - 24, cardHeight - 24, 12);
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = rarityColor;
  roundRect(ctx, 12, 12, CARD_WIDTH - 24, cardHeight - 24, 12);
  ctx.stroke();

  let y = MARGIN + 8;

  // Name
  ctx.font = "bold 26px serif";
  ctx.fillStyle = rarityColor;
  ctx.textBaseline = "top";
  ctx.fillText(name || "Unnamed Item", MARGIN, y);
  y += 34;

  // Subtitle (type + attunement)
  const attunement = data.requiresAttunement ? " (requires attunement)" : "";
  ctx.font = "italic 14px sans-serif";
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.fillText(`${data.itemType || "Untitled item type"}${attunement}`, MARGIN, y);
  y += 28;

  drawDivider(ctx, y, rarityColor);
  y += 16;

  // Badges row
  let badgeX = MARGIN;
  const badgeY = y;
  badgeX += drawBadge(ctx, data.rarity, badgeX, badgeY, rarityColor) + 8;
  if (data.requiresAttunement) {
    badgeX += drawBadge(ctx, "Attunement", badgeX, badgeY, rarityColor) + 8;
  }
  if (data.hasDamage) {
    badgeX += drawBadge(ctx, describeDamage(data.damage), badgeX, badgeY, rarityColor) + 8;
  }
  y += 22 + 14;

  // Weight / value line
  ctx.font = "12px sans-serif";
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.fillText(`${data.weightLb} lb   •   ${data.valueGp} gp`, MARGIN, y);
  y += 26;

  drawDivider(ctx, y, DIVIDER_MUTED);
  y += 16;

  // Flavor text
  if (data.flavorText.trim().length > 0) {
    y = drawWrappedText(ctx, data.flavorText, MARGIN, y, {
      font: "italic 14px serif",
      color: TEXT_SECONDARY,
      maxWidth: CONTENT_WIDTH,
      lineHeight: 20
    });
    y += 12;
  }

  // Mechanical text
  if (data.mechanicalText.trim().length > 0) {
    y = drawWrappedText(ctx, data.mechanicalText, MARGIN, y, {
      font: "15px sans-serif",
      color: TEXT_PRIMARY,
      maxWidth: CONTENT_WIDTH,
      lineHeight: 21
    });
    y += 12;
  }

  // Charges section
  if (data.hasCharges) {
    drawDivider(ctx, y, DIVIDER_MUTED, true);
    y += 14;
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.fillText("CHARGES", MARGIN, y);
    y += 18;
    y = drawWrappedText(ctx, formatChargesLine(data.charges), MARGIN, y, {
      font: "14px sans-serif",
      color: TEXT_PRIMARY,
      maxWidth: CONTENT_WIDTH,
      lineHeight: 20
    });
    y += 8;
  }

  // Damage section
  if (data.hasDamage) {
    drawDivider(ctx, y, DIVIDER_MUTED, true);
    y += 14;
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.fillText("DAMAGE", MARGIN, y);
    y += 18;
    y = drawWrappedText(ctx, describeDamage(data.damage), MARGIN, y, {
      font: "14px sans-serif",
      color: TEXT_PRIMARY,
      maxWidth: CONTENT_WIDTH,
      lineHeight: 20
    });
  }
}

export async function renderItemCardToPng(name: string, data: MagicItemData): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  renderItemCard(canvas, name, data);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png");
  });

  if (!blob) {
    throw new Error("Failed to render item card to PNG.");
  }

  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
