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

/**
 * Soft cap on how tall a single physical card is allowed to grow before
 * we split the stat block onto a continuation card instead of squeezing
 * everything into one ever-taller canvas. At CARD_WIDTH=640px this is
 * roughly a 5x9in card at the pixel density the rest of this file uses
 * (640px / 5in = 128px/in) — tall for a card, but still print-practical.
 * Creatures with very long stat blocks (lots of legendary/mythic actions)
 * will paginate across multiple cards rather than exceed this.
 */
const MAX_CARD_HEIGHT_PX = 1150;

const ACCENT = "#8f2c22";
const BACKGROUND = "#ffffff";
const SURFACE = "#faf8f4";
const TEXT_PRIMARY = "#1c1c1c";
const TEXT_SECONDARY = "#5a5a5a";

const LINE_HEIGHT = 19;

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
  lineHeight: number,
  font = "13px sans-serif"
): number {
  const lines = wrapLines(ctx, formatAbilityEntry(entry), {
    font,
    color: TEXT_PRIMARY,
    maxWidth: CONTENT_WIDTH,
    lineHeight
  });
  return lines.length * lineHeight + 4;
}

/** A self-contained, non-splittable chunk of card content, used for pagination. */
interface Block {
  height: number;
  /** Draws the block starting at cy, returns the new cy after drawing. */
  draw: (ctx: CanvasRenderingContext2D, cy: number) => number;
}

function traitBlock(measureCtx: CanvasRenderingContext2D, trait: CreatureAbilityEntry): Block {
  return {
    height: estimateEntryHeight(measureCtx, trait, LINE_HEIGHT, "italic 13px sans-serif") + 4,
    draw: (ctx, cy) => {
      const next = drawWrapped(ctx, formatAbilityEntry(trait), MARGIN, cy, {
        font: "italic 13px sans-serif",
        color: TEXT_PRIMARY,
        maxWidth: CONTENT_WIDTH,
        lineHeight: LINE_HEIGHT
      });
      return next + 4;
    }
  };
}

function sectionTitleHeight(): number {
  return 24;
}

function drawSectionTitle(ctx: CanvasRenderingContext2D, title: string, cy: number): number {
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
  return cy;
}

function entryBlock(measureCtx: CanvasRenderingContext2D, entry: CreatureAbilityEntry): Block {
  return {
    height: estimateEntryHeight(measureCtx, entry, LINE_HEIGHT) + 4,
    draw: (ctx, cy) => {
      const next = drawWrapped(ctx, formatAbilityEntry(entry), MARGIN, cy, {
        font: "13px sans-serif",
        color: TEXT_PRIMARY,
        maxWidth: CONTENT_WIDTH,
        lineHeight: LINE_HEIGHT
      });
      return next + 4;
    }
  };
}

/** A section title glued to its first entry, so a page break never leaves an orphaned heading. */
function sectionOpenBlock(
  measureCtx: CanvasRenderingContext2D,
  title: string,
  firstEntry: CreatureAbilityEntry
): Block {
  const entry = entryBlock(measureCtx, firstEntry);
  return {
    height: sectionTitleHeight() + entry.height,
    draw: (ctx, cy) => {
      cy = drawSectionTitle(ctx, title, cy);
      return entry.draw(ctx, cy);
    }
  };
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

/** Builds the fixed "front matter" (name through Challenge) as a single block, drawn only on the first card. */
function frontMatterBlock(measureCtx: CanvasRenderingContext2D, name: string, data: CreatureData): Block {
  let height = 30; // name
  height += 22; // subtitle
  height += 16; // divider gap
  height += measureLabeledLineHeight(
    measureCtx,
    "Armor Class",
    `${data.armorClass} ${data.armorClassNote}`.trim(),
    CONTENT_WIDTH,
    LINE_HEIGHT
  );
  height += measureLabeledLineHeight(
    measureCtx,
    "Hit Points",
    `${data.hitPoints}${data.hitDice ? ` (${data.hitDice})` : ""}`,
    CONTENT_WIDTH,
    LINE_HEIGHT
  );
  height += measureLabeledLineHeight(measureCtx, "Speed", formatSpeedLine(data), CONTENT_WIDTH, LINE_HEIGHT);
  height += 16;
  height +=
    wrapLines(measureCtx, formatAbilityLine(data), {
      font: "12px monospace",
      color: TEXT_PRIMARY,
      maxWidth: CONTENT_WIDTH,
      lineHeight: LINE_HEIGHT
    }).length * LINE_HEIGHT;
  height += 16;

  if (data.savingThrows.length > 0) {
    height += measureLabeledLineHeight(
      measureCtx,
      "Saving Throws",
      data.savingThrows.map((s) => `${s.name} ${s.bonus >= 0 ? "+" : ""}${s.bonus}`).join(", "),
      CONTENT_WIDTH,
      LINE_HEIGHT
    );
  }
  if (data.skills.length > 0) {
    height += measureLabeledLineHeight(
      measureCtx,
      "Skills",
      data.skills.map((s) => `${s.name} ${s.bonus >= 0 ? "+" : ""}${s.bonus}`).join(", "),
      CONTENT_WIDTH,
      LINE_HEIGHT
    );
  }
  if (data.damageVulnerabilities.length > 0) {
    height += measureLabeledLineHeight(
      measureCtx,
      "Damage Vulnerabilities",
      data.damageVulnerabilities.join(", "),
      CONTENT_WIDTH,
      LINE_HEIGHT
    );
  }
  if (data.damageResistances.length > 0) {
    height += measureLabeledLineHeight(
      measureCtx,
      "Damage Resistances",
      data.damageResistances.join(", "),
      CONTENT_WIDTH,
      LINE_HEIGHT
    );
  }
  if (data.damageImmunities.length > 0) {
    height += measureLabeledLineHeight(
      measureCtx,
      "Damage Immunities",
      data.damageImmunities.join(", "),
      CONTENT_WIDTH,
      LINE_HEIGHT
    );
  }
  if (data.conditionImmunities.length > 0) {
    height += measureLabeledLineHeight(
      measureCtx,
      "Condition Immunities",
      data.conditionImmunities.join(", "),
      CONTENT_WIDTH,
      LINE_HEIGHT
    );
  }
  height += measureLabeledLineHeight(measureCtx, "Senses", formatSensesLine(data), CONTENT_WIDTH, LINE_HEIGHT);
  if (data.languages) {
    height += measureLabeledLineHeight(measureCtx, "Languages", data.languages, CONTENT_WIDTH, LINE_HEIGHT);
  }
  height += measureLabeledLineHeight(measureCtx, "Challenge", formatCrLine(data), CONTENT_WIDTH, LINE_HEIGHT);
  height += 16;

  return {
    height,
    draw: (ctx, cyStart) => {
      let cy = cyStart;

      ctx.font = "bold 26px serif";
      ctx.fillStyle = ACCENT;
      ctx.textBaseline = "top";
      ctx.fillText(name || "Unnamed Creature", MARGIN, cy);
      cy += 30;

      ctx.font = "italic 13px sans-serif";
      ctx.fillStyle = TEXT_SECONDARY;
      ctx.fillText(`${sizeLabel(data.size)} ${data.creatureType || "creature"}, ${data.alignment}`, MARGIN, cy);
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
        LINE_HEIGHT
      );
      cy = drawLabeledLine(
        ctx,
        "Hit Points",
        `${data.hitPoints}${data.hitDice ? ` (${data.hitDice})` : ""}`,
        MARGIN,
        cy,
        CONTENT_WIDTH,
        LINE_HEIGHT
      );
      cy = drawLabeledLine(ctx, "Speed", formatSpeedLine(data), MARGIN, cy, CONTENT_WIDTH, LINE_HEIGHT);

      cy += 16;
      drawDivider(ctx, cy);
      cy += 16;

      cy = drawWrapped(ctx, formatAbilityLine(data), MARGIN, cy, {
        font: "12px monospace",
        color: TEXT_PRIMARY,
        maxWidth: CONTENT_WIDTH,
        lineHeight: LINE_HEIGHT
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
          LINE_HEIGHT
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
          LINE_HEIGHT
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
          LINE_HEIGHT
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
          LINE_HEIGHT
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
          LINE_HEIGHT
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
          LINE_HEIGHT
        );
      }
      cy = drawLabeledLine(ctx, "Senses", formatSensesLine(data), MARGIN, cy, CONTENT_WIDTH, LINE_HEIGHT);
      if (data.languages) {
        cy = drawLabeledLine(ctx, "Languages", data.languages, MARGIN, cy, CONTENT_WIDTH, LINE_HEIGHT);
      }
      cy = drawLabeledLine(ctx, "Challenge", formatCrLine(data), MARGIN, cy, CONTENT_WIDTH, LINE_HEIGHT);

      cy += 16;
      drawDivider(ctx, cy);
      cy += 16;
      return cy;
    }
  };
}

/** Small header repeated at the top of continuation cards ("Name (cont.)"). */
function continuationHeaderBlock(name: string): Block {
  return {
    height: 22 + 16,
    draw: (ctx, cyStart) => {
      let cy = cyStart;
      ctx.font = "bold 18px serif";
      ctx.fillStyle = ACCENT;
      ctx.textBaseline = "top";
      ctx.fillText(`${name || "Unnamed Creature"} (cont.)`, MARGIN, cy);
      cy += 22;
      drawDivider(ctx, cy);
      cy += 16;
      return cy;
    }
  };
}

function buildContentBlocks(measureCtx: CanvasRenderingContext2D, data: CreatureData): Block[] {
  const blocks: Block[] = [];
  for (const trait of data.traits) blocks.push(traitBlock(measureCtx, trait));

  const actionGroups: Array<[string, CreatureAbilityEntry[]]> = [
    ["Actions", data.actions],
    ["Bonus Actions", data.bonusActions],
    ["Reactions", data.reactions],
    ["Legendary Actions", data.legendaryActions],
    ["Lair Actions", data.lairActions],
    ["Mythic Actions", data.mythicActions]
  ];

  for (const [title, entries] of actionGroups) {
    if (entries.length === 0) continue;
    blocks.push(sectionOpenBlock(measureCtx, title, entries[0]));
    for (const entry of entries.slice(1)) blocks.push(entryBlock(measureCtx, entry));
  }

  return blocks;
}

/** One planned physical card: the blocks that will be drawn on it, and its total pixel height. */
interface CardPlan {
  blocks: Block[];
  height: number;
}

function planCards(measureCtx: CanvasRenderingContext2D, name: string, data: CreatureData): CardPlan[] {
  const front = frontMatterBlock(measureCtx, name, data);
  const contentBlocks = buildContentBlocks(measureCtx, data);
  const continuationHeight = continuationHeaderBlock(name).height;

  const plans: CardPlan[] = [];
  let currentBlocks: Block[] = [front];
  let currentHeight = MARGIN + front.height;

  const budget = MAX_CARD_HEIGHT_PX - MARGIN; // bottom margin reserved

  for (const block of contentBlocks) {
    if (currentHeight + block.height > budget && currentBlocks.length > 1) {
      // Close out the current card and start a new continuation card.
      plans.push({ blocks: currentBlocks, height: Math.max(currentHeight + MARGIN, 400) });
      currentBlocks = [continuationHeaderBlock(name)];
      currentHeight = MARGIN + continuationHeight;
    }
    currentBlocks.push(block);
    currentHeight += block.height;
  }

  plans.push({ blocks: currentBlocks, height: Math.max(currentHeight + MARGIN, 400) });
  return plans;
}

function drawCard(canvas: HTMLCanvasElement, plan: CardPlan): void {
  canvas.width = CARD_WIDTH;
  canvas.height = plan.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available.");

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, CARD_WIDTH, plan.height);
  ctx.fillStyle = SURFACE;
  ctx.fillRect(12, 12, CARD_WIDTH - 24, plan.height - 24);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, CARD_WIDTH - 24, plan.height - 24);

  let cy = MARGIN;
  for (const block of plan.blocks) {
    cy = block.draw(ctx, cy);
  }
}

/**
 * Measures the full card content first (stat blocks vary wildly in length),
 * then draws onto a canvas sized to fit — unlike the fixed-size item card.
 * Draws the WHOLE stat block onto a single canvas regardless of height;
 * used for the standalone per-asset PNG export and thumbnails, where an
 * arbitrarily tall single image is fine. For placement in Print Studio,
 * prefer renderCreatureCardToCanvases, which paginates onto print-sized
 * cards instead of producing one oversized card.
 */
export function renderCreatureCard(canvas: HTMLCanvasElement, name: string, rawData: CreatureData): void {
  const data = normalizeCreatureData(rawData);
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Canvas 2D context is not available.");

  const front = frontMatterBlock(measureCtx, name, data);
  const contentBlocks = buildContentBlocks(measureCtx, data);
  const allBlocks = [front, ...contentBlocks];
  const height = Math.max(MARGIN + allBlocks.reduce((sum, b) => sum + b.height, 0) + MARGIN, 400);

  drawCard(canvas, { blocks: allBlocks, height });
}

/**
 * Like renderCreatureCard, but splits an oversized stat block across
 * multiple print-sized canvases instead of producing one very tall
 * canvas. Each canvas after the first repeats the creature's name with
 * a "(cont.)" suffix. Short stat blocks still return a single-element
 * array, identical to what renderCreatureCard would draw.
 */
export function renderCreatureCardToCanvases(name: string, rawData: CreatureData): HTMLCanvasElement[] {
  const data = normalizeCreatureData(rawData);
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Canvas 2D context is not available.");

  const plans = planCards(measureCtx, name, data);
  return plans.map((plan) => {
    const canvas = document.createElement("canvas");
    drawCard(canvas, plan);
    return canvas;
  });
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
