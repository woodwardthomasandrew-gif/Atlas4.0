import { jsPDF } from "jspdf";
import { getAsset } from "@app/db/assetStore";
import { pxToPt, type HandoutData, type HandoutElement } from "./schema";

function addElement(pdf: jsPDF, element: HandoutElement, yPage: number, imageMap: Map<string, string>): void {
  if (!element.visible || element.opacity <= 0) return;
  const y = yPage + element.y;
  const xPt = pxToPt(element.x), yPt = pxToPt(y), w = pxToPt(element.width), h = pxToPt(element.height);
  pdf.saveGraphicsState();
  pdf.setGState(new (pdf as any).GState({ opacity: element.opacity, fillOpacity: element.opacity, strokeOpacity: element.opacity }));
  if (element.type === "text") {
    const family = /courier/i.test(element.fontFamily ?? "") ? "courier" : /georgia|times/i.test(element.fontFamily ?? "") ? "times" : "helvetica";
    const style = element.italic && element.fontWeight === "bold" ? "bolditalic" : element.italic ? "italic" : element.fontWeight === "bold" ? "bold" : "normal";
    pdf.setFont(family, style);
    pdf.setFontSize(pxToPt(element.fontSize ?? 24)); pdf.setTextColor(element.color ?? "#252018");
    const lines = pdf.splitTextToSize(element.text ?? "", Math.max(1, w));
    pdf.text(lines, xPt, yPt + pxToPt(element.fontSize ?? 24), { align: element.align ?? "left", angle: element.rotation, maxWidth: w, lineHeightFactor: element.lineHeight ?? 1.2 });
  } else if (element.type === "image") {
    const image = imageMap.get(element.artworkId ?? "");
    if (image) { pdf.addImage(image, "AUTO", xPt, yPt, w, h, undefined, "FAST", element.rotation); }
  } else {
    if (element.fill && element.fill !== "transparent") pdf.setFillColor(element.fill);
    if (element.stroke) { pdf.setDrawColor(element.stroke); pdf.setLineWidth(pxToPt(element.strokeWidth ?? 1)); }
    let points: Array<[number, number]>;
    const closed = element.type !== "line";
    if (element.type === "line") points = [[0, 0], [w, h]];
    else if (element.type === "ellipse") points = Array.from({ length: 49 }, (_, i) => [w / 2 + Math.cos((i / 48) * Math.PI * 2) * w / 2, h / 2 + Math.sin((i / 48) * Math.PI * 2) * h / 2] as [number, number]);
    else points = [[0, 0], [w, 0], [w, h], [0, h], [0, 0]];
    const radians = (element.rotation * Math.PI) / 180, cx = w / 2, cy = h / 2;
    const absolute = points.map(([px, py]) => [xPt + cx + (px - cx) * Math.cos(radians) - (py - cy) * Math.sin(radians), yPt + cy + (px - cx) * Math.sin(radians) + (py - cy) * Math.cos(radians)] as [number, number]);
    const deltas = absolute.slice(1).map(([px, py], index) => [px - absolute[index][0], py - absolute[index][1]]);
    pdf.lines(deltas, absolute[0][0], absolute[0][1], 1, element.fill && element.fill !== "transparent" ? "FD" : "S", closed);
  }
  pdf.restoreGraphicsState();
}

export async function exportHandoutPdf(data: HandoutData): Promise<Uint8Array> {
  const artworkIds = [...new Set(data.pages.flatMap((page) => page.elements.filter((el) => el.type === "image" && el.artworkId).map((el) => el.artworkId!)))];
  const imageMap = new Map<string, string>();
  for (const id of artworkIds) {
    const asset = await getAsset(id);
    if (!asset || asset.type !== "handout-artwork" || typeof (asset.data as { dataUrl?: unknown }).dataUrl !== "string") throw new Error(`Artwork asset “${id}” is missing or invalid. Reimport the image before exporting.`);
    imageMap.set(id, (asset.data as { dataUrl: string }).dataUrl);
  }
  let pdf: jsPDF | undefined;
  for (const page of data.pages) {
    const size: [number, number] = [page.widthIn, page.heightIn];
    const pointSize: [number, number] = [size[0] * 72, size[1] * 72];
    const orientation = pointSize[0] > pointSize[1] ? "landscape" : "portrait";
    if (!pdf) pdf = new jsPDF({ unit: "pt", format: pointSize, orientation, compress: false }); else pdf.addPage(pointSize, orientation);
    if (page.background !== "#ffffff" && page.background !== "#fff") { pdf.setFillColor(page.background); pdf.rect(0, 0, pointSize[0], pointSize[1], "F"); }
    if (page.texture === "parchment" || page.texture === "aged") {
      pdf.setFillColor(page.texture === "aged" ? "#9b7046" : "#b39a6b");
      pdf.setGState(new (pdf as any).GState({ opacity: page.texture === "aged" ? 0.07 : 0.045 }));
      for (let i = 0; i < 9; i++) {
        const x = 35 + (i % 3) * page.widthIn * 96 / 3, y = 45 + Math.floor(i / 3) * page.heightIn * 96 / 3;
        const rx = 36 + (i % 2) * 15, ry = 20 + (i % 3) * 8;
        pdf.ellipse(pxToPt(x + rx), pxToPt(y + ry), pxToPt(rx), pxToPt(ry), "F");
      }
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
    }
    for (const element of page.elements) addElement(pdf, element, 0, imageMap);
  }
  return new Uint8Array(pdf!.output("arraybuffer"));
}
