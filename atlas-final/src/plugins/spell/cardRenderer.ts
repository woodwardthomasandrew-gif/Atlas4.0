import type { SpellData } from "./schema";
import { normalizeSpellData } from "./schema";
import {
  formatAreaOfEffect,
  formatComponentsLine,
  formatDamageHealingLine,
  formatLevelSchoolLine,
  formatResolutionLine
} from "./cardText";

const CARD_WIDTH = 600;
const MARGIN = 32;
const CONTENT_WIDTH = CARD_WIDTH - MARGIN * 2;

const ACCENT = "#2f4fa8";
const BACKGROUND = "#ffffff";
const SURFACE = "#faf8f4";
const TEXT_PRIMARY = "#1c1c1c";
const TEXT_SECONDARY = "#5a5a5a";

interface WrapOptions {
  font: string;
  color: string;
  maxWidth: number;
  lineHeight: number;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, options: WrapOptions): string[] {
  ctx.font = options.font;
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim().length === 0) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(" ");
    let line = "";
    for (const word of words) {
      const testLine = line.length === 0 ? word : `${line} ${word}`;
      if (ctx.measureText(testLine).width > options.maxWidth && line.length > 0) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line.length > 0) lines.push(line);
  }
  return lines;
}

function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: WrapOptions
): number {
  ctx.font = options.font;
  ctx.fillStyle = options.color;
  ctx.textBaseline = "top";
  let cursorY = y;
  for (const line of wrapLines(ctx, text, options)) {
    if (line.length === 0) {
      cursorY += options.lineHeight;
      continue;
    }
    ctx.fillText(line, x, cursorY);
    cursorY += options.lineHeight;
  }
  return cursorY;
}

function drawLabeledLine(
  ctx: CanvasRenderingContext2D,
  label: string,
  rest: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const font = "13px sans-serif";
  const boldFont = "bold 13px sans-serif";
  ctx.textBaseline = "top";

  const words = [{ text: `${label} `, bold: true }, ...rest.split(" ").map((w) => ({ text: `${w} `, bold: false }))];
  let cursorX = x;
  let cursorY = y;

  for (const word of words) {
    ctx.font = word.bold ? boldFont : font;
    const width = ctx.measureText(word.text).width;
    if (cursorX + width > x + maxWidth && cursorX > x) {
      cursorX = x;
      cursorY += lineHeight;
    }
    ctx.fillStyle = word.bold ? ACCENT : TEXT_PRIMARY;
    ctx.fillText(word.text, cursorX, cursorY);
    cursorX += width;
  }

  return cursorY + lineHeight;
}

/** Counts wrapped lines a labeled line ("**Label** rest...") will take, matching drawLabeledLine's wrap rule exactly. */
function countLabeledLineLines(
  ctx: CanvasRenderingContext2D,
  label: string,
  rest: string,
  maxWidth: number
): number {
  const font = "13px sans-serif";
  const boldFont = "bold 13px sans-serif";
  const words = [{ text: `${label} `, bold: true }, ...rest.split(" ").map((w) => ({ text: `${w} `, bold: false }))];

  let cursorX = 0;
  let lines = 1;
  for (const word of words) {
    ctx.font = word.bold ? boldFont : font;
    const width = ctx.measureText(word.text).width;
    if (cursorX + width > maxWidth && cursorX > 0) {
      cursorX = 0;
      lines += 1;
    }
    cursorX += width;
  }
  return lines;
}

function measureLabeledLineHeight(
  ctx: CanvasRenderingContext2D,
  label: string,
  rest: string,
  maxWidth: number,
  lineHeight: number
): number {
  return countLabeledLineLines(ctx, label, rest, maxWidth) * lineHeight;
}

function drawDivider(ctx: CanvasRenderingContext2D, y: number): void {
  ctx.save();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(CARD_WIDTH - MARGIN, y);
  ctx.stroke();
  ctx.restore();
}

export function renderSpellCard(canvas: HTMLCanvasElement, name: string, rawData: SpellData): void {
  const data = normalizeSpellData(rawData);
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Canvas 2D context is not available.");

  const lineHeight = 19;
  const resolutionLine = formatResolutionLine(data);
  const damageHealingLine = formatDamageHealingLine(data);
  const areaLine = formatAreaOfEffect(data.areaOfEffect);

  // Measuring pass
  let y = MARGIN;
  y += 30; // name
  y += 20; // subtitle
  y += 16;
  y += measureLabeledLineHeight(measureCtx, "Casting Time", data.castingTime, CONTENT_WIDTH, lineHeight);
  y += measureLabeledLineHeight(measureCtx, "Range", data.range, CONTENT_WIDTH, lineHeight);
  y += measureLabeledLineHeight(
    measureCtx,
    "Components",
    formatComponentsLine(data.components),
    CONTENT_WIDTH,
    lineHeight
  );
  y += measureLabeledLineHeight(measureCtx, "Duration", data.duration, CONTENT_WIDTH, lineHeight);
  y += 16;
  y += wrapLines(measureCtx, data.description, {
    font: "13px sans-serif",
    color: TEXT_PRIMARY,
    maxWidth: CONTENT_WIDTH,
    lineHeight
  }).length * lineHeight;
  y += 8;
  if (damageHealingLine) y += measureLabeledLineHeight(measureCtx, "Effect", damageHealingLine, CONTENT_WIDTH, lineHeight);
  if (areaLine) y += measureLabeledLineHeight(measureCtx, "Area", areaLine, CONTENT_WIDTH, lineHeight);
  if (data.conditionsApplied.length > 0) {
    y += measureLabeledLineHeight(
      measureCtx,
      "Conditions",
      data.conditionsApplied.join(", "),
      CONTENT_WIDTH,
      lineHeight
    );
  }
  if (resolutionLine) y += measureLabeledLineHeight(measureCtx, "Resolution", resolutionLine, CONTENT_WIDTH, lineHeight);
  if (data.scaling.canUpcast && data.scaling.description) {
    y += 24;
    y += wrapLines(measureCtx, data.scaling.description, {
      font: "13px sans-serif",
      color: TEXT_PRIMARY,
      maxWidth: CONTENT_WIDTH,
      lineHeight
    }).length * lineHeight;
  }
  if (data.classes.length > 0) {
    y += 4 + lineHeight; // matches the draw pass's single-line (unwrapped) classes text
  }
  y += MARGIN;

  const cardHeight = Math.max(y, 380);

  canvas.width = CARD_WIDTH;
  canvas.height = cardHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available.");

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, CARD_WIDTH, cardHeight);
  ctx.fillStyle = SURFACE;
  ctx.fillRect(12, 12, CARD_WIDTH - 24, cardHeight - 24);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, CARD_WIDTH - 24, cardHeight - 24);

  let cy = MARGIN;

  ctx.font = "bold 26px serif";
  ctx.fillStyle = ACCENT;
  ctx.textBaseline = "top";
  ctx.fillText(name || "Unnamed Spell", MARGIN, cy);
  cy += 30;

  ctx.font = "italic 13px sans-serif";
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.fillText(formatLevelSchoolLine(data), MARGIN, cy);
  cy += 20;

  drawDivider(ctx, cy);
  cy += 16;

  cy = drawLabeledLine(ctx, "Casting Time", data.castingTime, MARGIN, cy, CONTENT_WIDTH, lineHeight);
  cy = drawLabeledLine(ctx, "Range", data.range, MARGIN, cy, CONTENT_WIDTH, lineHeight);
  cy = drawLabeledLine(
    ctx,
    "Components",
    formatComponentsLine(data.components),
    MARGIN,
    cy,
    CONTENT_WIDTH,
    lineHeight
  );
  cy = drawLabeledLine(ctx, "Duration", data.duration, MARGIN, cy, CONTENT_WIDTH, lineHeight);

  cy += 16;
  drawDivider(ctx, cy);
  cy += 16;

  cy = drawWrapped(ctx, data.description, MARGIN, cy, {
    font: "13px sans-serif",
    color: TEXT_PRIMARY,
    maxWidth: CONTENT_WIDTH,
    lineHeight
  });
  cy += 8;

  if (damageHealingLine) {
    cy = drawLabeledLine(ctx, "Effect", damageHealingLine, MARGIN, cy, CONTENT_WIDTH, lineHeight);
  }
  if (areaLine) {
    cy = drawLabeledLine(ctx, "Area", areaLine, MARGIN, cy, CONTENT_WIDTH, lineHeight);
  }
  if (data.conditionsApplied.length > 0) {
    cy = drawLabeledLine(
      ctx,
      "Conditions",
      data.conditionsApplied.join(", "),
      MARGIN,
      cy,
      CONTENT_WIDTH,
      lineHeight
    );
  }
  if (resolutionLine) {
    cy = drawLabeledLine(ctx, "Resolution", resolutionLine, MARGIN, cy, CONTENT_WIDTH, lineHeight);
  }

  if (data.scaling.canUpcast && data.scaling.description) {
    cy += 6;
    ctx.font = "bold 14px serif";
    ctx.fillStyle = ACCENT;
    ctx.textBaseline = "top";
    ctx.fillText("At Higher Levels", MARGIN, cy);
    cy += 20;
    cy = drawWrapped(ctx, data.scaling.description, MARGIN, cy, {
      font: "13px sans-serif",
      color: TEXT_PRIMARY,
      maxWidth: CONTENT_WIDTH,
      lineHeight
    });
  }

  if (data.classes.length > 0) {
    cy += 4;
    ctx.font = "italic 12px sans-serif";
    ctx.fillStyle = TEXT_SECONDARY;
    ctx.fillText(data.classes.join(", "), MARGIN, cy);
  }
}

export async function renderSpellCardToPng(name: string, data: SpellData): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  renderSpellCard(canvas, name, data);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png");
  });

  if (!blob) {
    throw new Error("Failed to render spell card to PNG.");
  }

  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
