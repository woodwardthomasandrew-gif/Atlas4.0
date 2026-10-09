import { describe, expect, it } from "vitest";
import { exportPrintLayoutToPdf } from "@plugins/print-studio/exportPdf";
import {
  getPageDimensionsIn,
  PAGE_DIMENSIONS_IN,
  type PageSize,
  type PrintLayoutData,
  withPageSettings
} from "@plugins/print-studio/schema";

describe("Print Studio paper sizes", () => {
  const expected: Record<PageSize, [number, number]> = {
    letter: [8.5, 11],
    legal: [8.5, 14],
    tabloid: [11, 17],
    a3: [297 / 25.4, 420 / 25.4],
    a4: [210 / 25.4, 297 / 25.4],
    a5: [148 / 25.4, 210 / 25.4],
    a6: [105 / 25.4, 148 / 25.4]
  };

  it.each(Object.entries(expected))("resolves %s to physical inches", (size, dimensions) => {
    const pageSize = size as PageSize;
    expect(PAGE_DIMENSIONS_IN[pageSize]).toEqual({ widthIn: dimensions[0], heightIn: dimensions[1] });
    expect(getPageDimensionsIn(pageSize, "landscape")).toEqual({ widthIn: dimensions[1], heightIn: dimensions[0] });
  });

  it.each(["letter", "legal", "tabloid", "a3", "a4", "a5", "a6"] as PageSize[])(
    "exports %s with matching PDF page dimensions in both orientations",
    async (pageSize) => {
      for (const orientation of ["portrait", "landscape"] as const) {
        const data: PrintLayoutData = { pageSize, orientation, pages: [{ id: "p1", placements: [] }, { id: "p2", placements: [] }] };
        const bytes = await exportPrintLayoutToPdf(data);
        const source = new TextDecoder().decode(bytes);
        const boxes = [...source.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)];
        const dimensions = getPageDimensionsIn(pageSize, orientation);
        expect(boxes).toHaveLength(2);
        for (const box of boxes) {
          expect(Number(box[1])).toBeCloseTo(dimensions.widthIn * 72, 1);
          expect(Number(box[2])).toBeCloseTo(dimensions.heightIn * 72, 1);
        }
      }
    }
  );

  it("uses portrait for layouts saved before orientation was added", async () => {
    const bytes = await exportPrintLayoutToPdf({ pageSize: "letter", pages: [{ id: "p1", placements: [] }] });
    const source = new TextDecoder().decode(bytes);
    const box = source.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
    expect(box).not.toBeNull();
    expect(Number(box![1])).toBeCloseTo(8.5 * 72, 1);
    expect(Number(box![2])).toBeCloseTo(11 * 72, 1);
  });

  it("preserves every placement and page when paper size or orientation changes", () => {
    const layout: PrintLayoutData = {
      pageSize: "letter",
      pages: [
        { id: "first", placements: [{ id: "card-a", assetType: "creature", assetId: "a", name: "A", xIn: 9, yIn: 10, widthIn: 2.25, heightIn: 3.5, rotationDeg: 37, cardPageIndex: 2 }] },
        { id: "second", placements: [{ id: "card-b", assetType: "spell", assetId: "b", name: "B", xIn: -0.5, yIn: 1.75, widthIn: 1, heightIn: 2, rotationDeg: 90 }] }
      ]
    };
    const sized = withPageSettings(layout, "a6");
    const landscape = withPageSettings(sized, "a6", "landscape");
    expect(landscape.pages).toEqual(layout.pages);
    expect(landscape.orientation).toBe("landscape");
    expect(landscape.pages[0].placements[0]).toMatchObject({ xIn: 9, yIn: 10, widthIn: 2.25, heightIn: 3.5, rotationDeg: 37, cardPageIndex: 2 });
  });
});
