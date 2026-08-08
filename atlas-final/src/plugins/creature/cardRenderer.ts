import type { CreatureAbilityEntry, CreatureData } from "./schema";
import { normalizeCreatureData } from "./schema";
import {
  formatAbilityEntry,
  formatAbilityLine,
  formatCrLine,
  formatSensesLine,
  formatSpeedLine,
  sizeLabel
} from "./cardText";

const CARD_WIDTH = 640;
const MARGIN = 32;
const CONTENT_WIDTH = CARD_WIDTH - MARGIN * 2;

const ACCENT = "#8f2c22";
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
  const words = text.split(" ");
  const lines: string[] = [];
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
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim().length === 0) {
      cursorY += options.lineHeight;
      continue;
    }
    const lines = wrapLines(ctx, paragraph, options);
    for (const line of lines) {
      ctx.fillText(line, x, cursorY);
      cursorY += options.lineHeight;
    }
  }
  return cursorY;
}

/** Draws a "**Label** rest of line" style paragraph, bolding just the label, wrapped to width. */
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

function estimateEntryHeight(
  ctx: CanvasRenderingContext2D,
  entry: CreatureAbilityEntry,
  lineHeight: number
): number {
  const lines = wrapLines(ctx, formatAbilityEntry(entry), {
    font: "13px sans-serif",
    color: TEXT_PRIMARY,
    maxWidth: CONTENT_WIDTH,
    lineHeight
  });
  return lines.length * lineHeight + 4;
}

/**
 * Measures the full card content first (stat blocks vary wildly in length),
 * then draws onto a canvas sized to fit — unlike the fixed-size item card.
 */
export function renderCreatureCard(canvas: HTMLCanvasElement, name: string, rawData: CreatureData): void {
  const data = normalizeCreatureData(rawData);
  // Measuring pass on an off-screen context to compute total height.
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Canvas 2D context is not available.");

  const lineHeight = 19;
  let y = MARGIN;

  y += 30; // name
  y += 22; // subtitle
  y += 16; // divider gap
  y += lineHeight * 3; // AC / HP / Speed
  y += 16;
  y += lineHeight; // ability line
  y += 16;

  if (data.savingThrows.length > 0) y += lineHeight;
  if (data.skills.length > 0) y += lineHeight;
  if (data.damageVulnerabilities.length > 0) y += lineHeight;
  if (data.damageResistances.length > 0) y += lineHeight;
  if (data.damageImmunities.length > 0) y += lineHeight;
  if (data.conditionImmunities.length > 0) y += lineHeight;
  y += lineHeight; // senses
  if (data.languages) y += lineHeight;
  y += lineHeight; // challenge
  y += 16;

  for (const trait of data.traits) y += estimateEntryHeight(measureCtx, trait, lineHeight);

  const actionGroups: Array<[string, CreatureAbilityEntry[]]> = [
    ["Actions", data.actions],
    ["Bonus Actions", data.bonusActions],
    ["Reactions", data.reactions],
    ["Legendary Actions", data.legendaryActions],
    ["Lair Actions", data.lairActions],
    ["Mythic Actions", data.mythicActions]
  ];

  for (const [, entries] of actionGroups) {
    if (entries.length === 0) continue;
    y += 24; // section title
    for (const entry of entries) y += estimateEntryHeight(measureCtx, entry, lineHeight);
  }

  y += MARGIN;
  const cardHeight = Math.max(y, 400);

  // Draw pass
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
  ctx.fillText(name || "Unnamed Creature", MARGIN, cy);
  cy += 30;

  ctx.font = "italic 13px sans-serif";
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.fillText(
    `${sizeLabel(data.size)} ${data.creatureType || "creature"}, ${data.alignment}`,
    MARGIN,
    cy
  );
  cy += 22;

  drawDivider(ctx, cy);
  cy += 16;

  cy = drawLabeledLine(
    ctx,
    "Armor Class",
    `${data.armorClass} ${data.armorClassNote}`.trim(),
    MARGIN,
    cy,
    CONTENT_WIDTH,
    lineHeight
  );
  cy = drawLabeledLine(
    ctx,
    "Hit Points",
    `${data.hitPoints}${data.hitDice ? ` (${data.hitDice})` : ""}`,
    MARGIN,
    cy,
    CONTENT_WIDTH,
    lineHeight
  );
  cy = drawLabeledLine(ctx, "Speed", formatSpeedLine(data), MARGIN, cy, CONTENT_WIDTH, lineHeight);

  cy += 16;
  drawDivider(ctx, cy);
  cy += 16;

  cy = drawWrapped(ctx, formatAbilityLine(data), MARGIN, cy, {
    font: "12px monospace",
    color: TEXT_PRIMARY,
    maxWidth: CONTENT_WIDTH,
    lineHeight
  });

  cy += 16;
  drawDivider(ctx, cy);
  cy += 16;

  if (data.savingThrows.length > 0) {
    cy = drawLabeledLine(
      ctx,
      "Saving Throws",
      data.savingThrows.map((s) => `${s.name} ${s.bonus >= 0 ? "+" : ""}${s.bonus}`).join(", "),
      MARGIN,
      cy,
      CONTENT_WIDTH,
      lineHeight
    );
  }
  if (data.skills.length > 0) {
    cy = drawLabeledLine(
      ctx,
      "Skills",
      data.skills.map((s) => `${s.name} ${s.bonus >= 0 ? "+" : ""}${s.bonus}`).join(", "),
      MARGIN,
      cy,
      CONTENT_WIDTH,
      lineHeight
    );
  }
  if (data.damageVulnerabilities.length > 0) {
    cy = drawLabeledLine(
      ctx,
      "Damage Vulnerabilities",
      data.damageVulnerabilities.join(", "),
      MARGIN,
      cy,
      CONTENT_WIDTH,
      lineHeight
    );
  }
  if (data.damageResistances.length > 0) {
    cy = drawLabeledLine(
      ctx,
      "Damage Resistances",
      data.damageResistances.join(", "),
      MARGIN,
      cy,
      CONTENT_WIDTH,
      lineHeight
    );
  }
  if (data.damageImmunities.length > 0) {
    cy = drawLabeledLine(
      ctx,
      "Damage Immunities",
      data.damageImmunities.join(", "),
      MARGIN,
      cy,
      CONTENT_WIDTH,
      lineHeight
    );
  }
  if (data.conditionImmunities.length > 0) {
    cy = drawLabeledLine(
      ctx,
      "Condition Immunities",
      data.conditionImmunities.join(", "),
      MARGIN,
      cy,
      CONTENT_WIDTH,
      lineHeight
    );
  }
  cy = drawLabeledLine(ctx, "Senses", formatSensesLine(data), MARGIN, cy, CONTENT_WIDTH, lineHeight);
  if (data.languages) {
    cy = drawLabeledLine(ctx, "Languages", data.languages, MARGIN, cy, CONTENT_WIDTH, lineHeight);
  }
  cy = drawLabeledLine(ctx, "Challenge", formatCrLine(data), MARGIN, cy, CONTENT_WIDTH, lineHeight);

  cy += 16;
  drawDivider(ctx, cy);
  cy += 16;

  for (const trait of data.traits) {
    cy = drawWrapped(ctx, formatAbilityEntry(trait), MARGIN, cy, {
      font: "italic 13px sans-serif",
      color: TEXT_PRIMARY,
      maxWidth: CONTENT_WIDTH,
      lineHeight
    });
    cy += 4;
  }

  for (const [title, entries] of actionGroups) {
    if (entries.length === 0) continue;
    cy += 6;
    ctx.font = "bold 15px serif";
    ctx.fillStyle = ACCENT;
    ctx.textBaseline = "top";
    ctx.fillText(title, MARGIN, cy);
    cy += 20;
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN, cy - 4);
    ctx.lineTo(CARD_WIDTH - MARGIN, cy - 4);
    ctx.stroke();

    for (const entry of entries) {
      cy = drawWrapped(ctx, formatAbilityEntry(entry), MARGIN, cy, {
        font: "13px sans-serif",
        color: TEXT_PRIMARY,
        maxWidth: CONTENT_WIDTH,
        lineHeight
      });
      cy += 4;
    }
  }
}

export async function renderCreatureCardToPng(name: string, data: CreatureData): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  renderCreatureCard(canvas, name, data);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png");
  });

  if (!blob) {
    throw new Error("Failed to render creature card to PNG.");
  }

  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
