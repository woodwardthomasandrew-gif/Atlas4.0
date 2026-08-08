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
      if (!definition?.renderCardToCanvas) continue;

      const record = await getAsset(placement.assetId);
      if (!record) continue;

      const canvas = document.createElement("canvas");
      definition.renderCardToCanvas(canvas, record.name, record.data);
      const dataUrl = canvas.toDataURL("image/png");

      pdf.addImage(
        dataUrl,
        "PNG",
        placement.xIn,
        placement.yIn,
        placement.widthIn,
        placement.heightIn,
        undefined,
        undefined,
        placement.rotationDeg
      );
    }
  }

  const arrayBuffer = pdf.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}
