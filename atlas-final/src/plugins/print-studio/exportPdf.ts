import { jsPDF } from "jspdf";
import { getAsset } from "@app/db/assetStore";
import { getAllAssetTypes } from "@app/registry/assetRegistry";
import type { PrintLayoutData } from "./schema";

export async function exportPrintLayoutToPdf(data: PrintLayoutData): Promise<Uint8Array> {
  const format = data.pageSize === "letter" ? "letter" : "a4";
  const pdf = new jsPDF({ unit: "in", format, orientation: "portrait" });

  for (let pageIndex = 0; pageIndex < data.pages.length; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage(format, "portrait");
    }

    const page = data.pages[pageIndex];

    for (const placement of page.placements) {
      const definition = getAllAssetTypes().find((d) => d.type === placement.assetType);
      if (!definition?.renderCardToCanvas && !definition?.renderCardToCanvases) continue;

      const record = await getAsset(placement.assetId);
      if (!record) continue;

      let canvas: HTMLCanvasElement | null = null;
      if (definition.renderCardToCanvases) {
        canvas = definition.renderCardToCanvases(record.name, record.data)[placement.cardPageIndex ?? 0] ?? null;
      } else if (definition.renderCardToCanvas) {
        canvas = document.createElement("canvas");
        definition.renderCardToCanvas(canvas, record.name, record.data);
      }
      if (!canvas || canvas.width === 0 || canvas.height === 0) continue;

      const dataUrl = canvas.toDataURL("image/png");

      // Fit the image inside the placement box preserving its real aspect
      // ratio (rather than stretching to widthIn x heightIn, which
      // distorted/squashed tall stat blocks), centering any leftover
      // space within the box.
      const scale = Math.min(placement.widthIn / canvas.width, placement.heightIn / canvas.height);
      const drawWidthIn = canvas.width * scale;
      const drawHeightIn = canvas.height * scale;
      const drawXIn = placement.xIn + (placement.widthIn - drawWidthIn) / 2;
      const drawYIn = placement.yIn + (placement.heightIn - drawHeightIn) / 2;

      pdf.addImage(
        dataUrl,
        "PNG",
        drawXIn,
        drawYIn,
        drawWidthIn,
        drawHeightIn,
        undefined,
        undefined,
        placement.rotationDeg
      );
    }
  }

  const arrayBuffer = pdf.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}
