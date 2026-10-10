import { describe, expect, it } from "vitest";
import { createHandout, PX_PER_IN, pxToPt, ptToPx, validateHandout, type HandoutData } from "@plugins/handout-studio/schema";
import { exportHandoutPdf } from "@plugins/handout-studio/exportPdf";
import { HANDOUT_TEMPLATES } from "@plugins/handout-studio/templates";
import { getAsset, saveAsset } from "@app/db/assetStore";

describe("Handout Studio document model", () => {
  it("validates schema version and page/element data", () => {
    const handout = createHandout();
    expect(validateHandout(handout).valid).toBe(true);
    expect(validateHandout({ ...handout, schemaVersion: 99 }).errors[0]).toContain("Unsupported");
    expect(validateHandout({ ...handout, pages: [] }).valid).toBe(false);
    expect(validateHandout({ ...handout, pages: [{ ...handout.pages[0], widthIn: 0 }] }).valid).toBe(false);
  });
  it("converts between the documented 96 px/in and PDF points", () => {
    expect(ptToPx(72)).toBe(PX_PER_IN);
    expect(pxToPt(PX_PER_IN)).toBe(72);
    expect(pxToPt(ptToPx(13.2))).toBeCloseTo(13.2, 10);
  });
  it("round trips ordered mixed-size pages through generic asset persistence", async () => {
    const savedRows = new Map<string, { id: string; type: string; name: string; data: string; created_at: string; updated_at: string }>();
    const previous = window.atlas;
    window.atlas = { db: {
      query: async (_sql, params = []) => { const row=savedRows.get(String(params[0]));return row?[row]:[]; },
      run: async (_sql, params = []) => { const [id,type,name,data]=params as [string,string,string,string];savedRows.set(id,{id,type,name,data,created_at:"now",updated_at:"now"});return {changes:1,lastInsertRowid:1}; }
    }, app: { getVersion: async () => "test", printPdf: async () => undefined, savePdf: async () => true, onRequestSave: () => () => undefined, saveComplete: async () => undefined } };
    try {
      const data=createHandout();data.pages.push({id:"second",widthIn:5.8,heightIn:8.3,background:"#eee",elements:[]});
      await saveAsset({id:"roundtrip",type:"handout",name:"Mixed document",data});
      expect(await getAsset("roundtrip")).toMatchObject({name:"Mixed document",data:{schemaVersion:1,pages:[{id:data.pages[0].id},{id:"second",widthIn:5.8}]}});
    } finally { window.atlas=previous; }
  });
  it("creates editable independent template documents", () => {
    const template = HANDOUT_TEMPLATES.find((entry) => entry.id === "letter")!;
    const first = template.create(), second = template.create();
    first.pages[0].elements[0].text = "Changed";
    expect(second.pages[0].elements[0].text).toBe("My dearest friend,");
    expect(first.pages[0].elements[0].id).not.toBe(second.pages[0].elements[0].id);
  });
  it("requires referenced artwork and reports a removed artwork asset on export", async () => {
    const document = createHandout();
    document.pages[0].elements.push({ id: "img", type: "image", x: 1, y: 1, width: 10, height: 10, rotation: 0, opacity: 1, visible: true, locked: false, artworkId: "gone" });
    const original = window.atlas;
    window.atlas = { db: { query: async () => [], run: async () => ({ changes: 0, lastInsertRowid: 0 }) }, app: { getVersion: async () => "test", printPdf: async () => undefined, savePdf: async () => true, onRequestSave: () => () => undefined, saveComplete: async () => undefined } };
    try { await expect(exportHandoutPdf(document)).rejects.toThrow("missing or invalid"); } finally { window.atlas = original; }
    document.pages[0].elements[0].artworkId = "";
    expect(validateHandout(document).valid).toBe(false);
  });
  it("exports mixed physical page sizes and keeps text in the PDF content stream", async () => {
    const data: HandoutData = { schemaVersion: 1, pages: [
      { id: "letter", widthIn: 8.5, heightIn: 11, background: "#ffffff", elements: [{ id: "t", type: "text", x: 96, y: 96, width: 500, height: 100, rotation: 0, opacity: 1, visible: true, locked: false, text: "A campaign letter", fontSize: 24 }] },
      { id: "a5-landscape", widthIn: 210 / 25.4, heightIn: 148 / 25.4, background: "#fffdf6", elements: [] }
    ] };
    const source = new TextDecoder().decode(await exportHandoutPdf(data));
    const boxes = [...source.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)];
    expect(boxes).toHaveLength(2);
    expect(Number(boxes[0][1])).toBeCloseTo(612, 0); expect(Number(boxes[0][2])).toBeCloseTo(792, 0);
    expect(Number(boxes[1][1])).toBeCloseTo((210 / 25.4) * 72, 0); expect(Number(boxes[1][2])).toBeCloseTo((148 / 25.4) * 72, 0);
    expect(source).toContain("A campaign letter");
  });
});
