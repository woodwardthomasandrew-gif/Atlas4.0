import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultCreatureData } from "@plugins/creature/schema";
import { renderCreatureCardToCanvases } from "@plugins/creature/cardRenderer";

const contexts: Array<{ textY: number[]; borderBottom: number }> = [];

function installCanvasContextMock(): void {
  contexts.length = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    const record = { textY: [] as number[], borderBottom: 0 };
    contexts.push(record);
    const ctx = {
      font: "",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      textBaseline: "alphabetic",
      measureText: (text: string) => ({ width: text.length * 7 }),
      fillText: (_text: string, _x: number, y: number) => record.textY.push(y),
      fillRect: () => undefined,
      strokeRect: (_x: number, _y: number, _width: number, height: number) => {
        record.borderBottom = height + 12;
      },
      beginPath: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => undefined,
      save: () => undefined,
      restore: () => undefined
    };
    return ctx as unknown as CanvasRenderingContext2D;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  contexts.length = 0;
});

describe("creature card vertical layout", () => {
  it("keeps short cards and optional sections inside the bottom padding", () => {
    installCanvasContextMock();
    const data = createDefaultCreatureData();
    data.actions.push({
      id: "action",
      name: "Quick Strike",
      description: "A short action.",
      attackBonus: null,
      saveDC: null,
      damage: null,
      extraAttacksCount: null
    });

    const [canvas] = renderCreatureCardToCanvases("Scout", data);
    const lastTextBottom = Math.max(...contexts.at(-1)!.textY) + 15;
    expect(lastTextBottom).toBeLessThanOrEqual(canvas.height - 32);
  });

  it("measures explicit and blank lines in long wrapped descriptions before pagination", () => {
    installCanvasContextMock();
    const data = createDefaultCreatureData();
    const longText = Array.from({ length: 26 }, (_, i) => `A substantial description line ${i + 1} with details.`).join("\n\n");
    data.actions.push({
      id: "long-action",
      name: "Many Paragraphs",
      description: longText,
      attackBonus: null,
      saveDC: null,
      damage: null,
      extraAttacksCount: null
    });
    data.notes = Array.from({ length: 30 }, (_, i) => `Field note ${i + 1}: additional creature information.`).join("\n");

    const cards = renderCreatureCardToCanvases("Archivist", data);
    expect(cards.length).toBeGreaterThan(1);
    expect(contexts).toHaveLength(cards.length + 1); // one measurement context plus one per panel
    cards.forEach((canvas, index) => {
      const lastTextBottom = Math.max(...contexts[index + 1].textY) + 15;
      expect(lastTextBottom).toBeLessThanOrEqual(canvas.height - 32);
    });
  });
});
