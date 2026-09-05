import { getComponentType } from "@app/registry/componentTypeRegistry";
import type { ComponentRecord } from "@app/db/componentStore";
import { describeDamage, type ItemDamage } from "@plugins/shared/damage";

const WIDTH = 640;
const PADDING = 42;
const ACCENT = "#5b8def";
const TEXT = "#1c1c1c";
const MUTED = "#5a5a5a";

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string): string[] {
  ctx.font = font;
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number): number {
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function optionalText(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Renders a component as a player-facing card, independent of creature statblock rendering. */
export function renderComponentCard(canvas: HTMLCanvasElement, component: ComponentRecord): void {
  const data = (component.data && typeof component.data === "object" ? component.data : {}) as Record<string, unknown>;
  const category = getComponentType(component.componentType)?.label ?? component.componentType;
  const tags = component.tags.filter(Boolean);
  const extraLines = [
    ["Activation", optionalText(data, ["activation", "activationType", "actionType"])],
    ["Usage", optionalText(data, ["usage", "uses", "recharge"])],
    ["Prerequisite", optionalText(data, ["prerequisite", "prerequisites"])]
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const combatLines: [string, string][] = [];
  if (typeof data.attackBonus === "number") combatLines.push(["Attack", `${data.attackBonus >= 0 ? "+" : ""}${data.attackBonus}`]);
  if (typeof data.saveDC === "number") combatLines.push(["Save DC", String(data.saveDC)]);
  if (data.damage && typeof data.damage === "object") combatLines.push(["Damage", describeDamage(data.damage as ItemDamage)]);
  if (typeof data.extraAttacksCount === "number" && data.extraAttacksCount > 1) combatLines.push(["Attacks", String(data.extraAttacksCount)]);
  extraLines.push(...combatLines);

  const descriptionLines = wrap(ctxFor(canvas), component.description || "", WIDTH - PADDING * 2, "24px sans-serif");
  const height = Math.max(360, 190 + descriptionLines.length * 32 + extraLines.length * 34 + (tags.length ? 58 : 0));
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = "#f7f9fd";
  ctx.fillRect(14, 14, WIDTH - 28, height - 28);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, WIDTH - 28, height - 28);
  ctx.textBaseline = "top";
  ctx.fillStyle = ACCENT;
  ctx.font = "bold 36px serif";
  let y = drawLines(ctx, wrap(ctx, component.name || "Unnamed Ability", WIDTH - PADDING * 2, "bold 36px serif"), PADDING, 42, 42);
  ctx.fillStyle = MUTED;
  ctx.font = "italic 20px sans-serif";
  y = drawLines(ctx, [category], PADDING, y + 10, 26) + 18;
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(WIDTH - PADDING, y); ctx.stroke();
  y += 24;
  ctx.fillStyle = TEXT;
  ctx.font = "24px sans-serif";
  y = drawLines(ctx, descriptionLines, PADDING, y, 32) + 18;
  for (const [label, value] of extraLines) {
    ctx.font = "bold 20px sans-serif"; ctx.fillStyle = ACCENT; ctx.fillText(`${label}:`, PADDING, y);
    const labelWidth = ctx.measureText(`${label}: `).width;
    ctx.font = "20px sans-serif"; ctx.fillStyle = TEXT; ctx.fillText(value, PADDING + labelWidth, y); y += 34;
  }
  if (tags.length) {
    ctx.font = "18px sans-serif"; ctx.fillStyle = MUTED;
    ctx.fillText(`Tags: ${tags.join(", ")}`, PADDING, y + 8);
  }
}

function ctxFor(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  return canvas.getContext("2d")!;
}
