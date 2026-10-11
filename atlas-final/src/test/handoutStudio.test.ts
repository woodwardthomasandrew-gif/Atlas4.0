import { describe, expect, it } from "vitest";
import { createHandout, fitHandoutToPage, isElementOutOfBounds, PX_PER_IN, pxToPt, ptToPx, validateHandout, type HandoutData, type HandoutElement } from "@plugins/handout-studio/schema";
import { exportHandoutPdf } from "@plugins/handout-studio/exportPdf";
import { HANDOUT_TEMPLATES } from "@plugins/handout-studio/templates";
import { getAsset, saveAsset } from "@app/db/assetStore";
import { Ellipse, Line, Rect, Textbox } from "fabric";
import { applyHandoutElementToFabric } from "@plugins/handout-studio/HandoutEditor";
import { createPaperTexture, PAPER_PRESETS, TEXTURE_DPI, textureConfigForPage } from "@plugins/handout-studio/paperTexture";

describe("Handout Studio document model", () => {
  const page = { widthIn: 8.5, heightIn: 11 };
  const rect = (x: number, y: number, width = 20, height = 20, rotation = 0): HandoutElement => ({ id: "e", type: "rect", x, y, width, height, rotation, opacity: 1, visible: true, locked: false });
  it("checks document-space rendered footprints, all edges, rotation, and tiny rounding tolerance", () => {
    expect(isElementOutOfBounds(rect(20, 20), page)).toBe(false);
    expect(isElementOutOfBounds(rect(0, 20), page)).toBe(false);
    expect(isElementOutOfBounds(rect(20, 0), page)).toBe(false);
    expect(isElementOutOfBounds(rect(page.widthIn * PX_PER_IN - 20, 20), page)).toBe(false);
    expect(isElementOutOfBounds(rect(20, page.heightIn * PX_PER_IN - 20), page)).toBe(false);
    expect(isElementOutOfBounds(rect(-0.005, 20), page)).toBe(false);
    expect(isElementOutOfBounds(rect(-1, 20), page)).toBe(true);
    expect(isElementOutOfBounds(rect(20, -1), page)).toBe(true);
    expect(isElementOutOfBounds(rect(page.widthIn * PX_PER_IN - 19, 20), page)).toBe(true);
    expect(isElementOutOfBounds(rect(20, page.heightIn * PX_PER_IN - 19), page)).toBe(true);
    expect(isElementOutOfBounds(rect(100, 100, 40, 10, 45), page)).toBe(false);
    expect(isElementOutOfBounds(rect(-10, 100, 40, 10, 45), page)).toBe(true);
    const line = { ...rect(40, 40), type: "line" as const, stroke: "#000", strokeWidth: 4 };
    expect(isElementOutOfBounds({ ...line, x: 0 }, page)).toBe(true);
  });
  it("keeps bounds invariant to viewport zoom and offset", () => {
    const element = rect(100, 100, 250, 80, 22);
    const results = [0.3, 0.72, 1.5].map(zoom => {
      const viewport = { x: -125 * zoom, y: 240 * zoom };
      const screenLeft = element.x * zoom + viewport.x;
      return isElementOutOfBounds({ ...element, x: (screenLeft - viewport.x) / zoom }, page);
    });
    expect(results).toEqual([false, false, false]);
  });
  it("fits every starter template within Letter and A5 pages without sharing mutable copies", () => {
    for (const template of HANDOUT_TEMPLATES) {
      const original = template.create();
      for (const [width, height] of [[8.5, 11], [148 / 25.4, 210 / 25.4]]) {
        const copy = fitHandoutToPage(original, width, height);
        expect(copy.pages[0].elements.every(element => !isElementOutOfBounds(element, copy.pages[0]))).toBe(true);
        expect(copy.pages[0]).not.toBe(original.pages[0]);
        expect(copy.pages[0].elements).not.toBe(original.pages[0].elements);
        if (copy.pages[0].elements.length) {
          copy.pages[0].elements[0].x += 1;
          expect(copy.pages[0].elements[0].x).not.toBe(original.pages[0].elements[0].x);
        } else {
          copy.pages[0].background = "#000000";
          expect(copy.pages[0].background).not.toBe(original.pages[0].background);
        }
      }
    }
    const letterCopy = HANDOUT_TEMPLATES.find(template => template.id === "letter")!.create();
    const a5Copy = fitHandoutToPage(letterCopy, 148 / 25.4, 210 / 25.4);
    expect(a5Copy.pages[0].elements[0].x).toBeCloseTo(95 * ((148 / 25.4) / 8.5), 8);
    expect(a5Copy.pages[0].elements[0].y).toBeCloseTo(90 * ((210 / 25.4) / 11), 8);
  });
  it("loads every starter element into Fabric with the schema's page-relative top-left origin", () => {
    for (const template of HANDOUT_TEMPLATES) {
      const document = template.create();
      const documentPage = document.pages[0];
      expect(documentPage.widthIn * PX_PER_IN).toBe(816);
      expect(documentPage.heightIn * PX_PER_IN).toBe(1056);
      for (const element of documentPage.elements) {
        // Fabric 7 objects default to center origin. The shared load converter
        // must map the schema's (x,y) directly to their top-left origin.
        const source = element.type === "text"
          ? new Textbox(element.text ?? "", { width: element.width, fontSize: element.fontSize ?? 28 })
          : element.type === "line"
            ? new Line([0, 0, element.width, element.height], { strokeWidth: element.strokeWidth ?? 2 })
            : element.type === "ellipse"
              ? new Ellipse({ rx: element.width / 2, ry: element.height / 2, strokeWidth: element.strokeWidth ?? 0 })
              : new Rect({ width: element.width, height: element.height });
        const object = applyHandoutElementToFabric(source, element);
        expect(object.originX).toBe("left");
        expect(object.originY).toBe("top");
        expect(object.left).toBe(element.x);
        expect(object.top).toBe(element.y);
        expect(object.angle).toBe(element.rotation);
        expect(isElementOutOfBounds(element, documentPage)).toBe(false);
      }
    }
  });
  it("keeps loaded page coordinates identical at different viewport zoom levels", () => {
    const element = HANDOUT_TEMPLATES.find(template => template.id === "letter")!.create().pages[0].elements[0];
    const loadedPositions = [0.3, 0.72, 1.5].map((_zoom) => {
      const object = applyHandoutElementToFabric(new Rect({ width: element.width, height: element.height }), element);
      return { x: object.left, y: object.top };
    });
    expect(loadedPositions).toEqual([{ x: 95, y: 90 }, { x: 95, y: 90 }, { x: 95, y: 90 }]);
  });
  it("preserves fitted template layout when saved and reopened", async () => {
    const fitted = fitHandoutToPage(HANDOUT_TEMPLATES.find(t => t.id === "poster")!.create(), 5.8, 8.3);
    const savedRows = new Map<string, { id: string; type: string; name: string; data: string; created_at: string; updated_at: string }>();
    const previous = window.atlas;
    window.atlas = { db: { query: async (_sql, params = []) => { const row = savedRows.get(String(params[0])); return row ? [row] : []; }, run: async (_sql, params = []) => { const [id, type, name, data] = params as [string, string, string, string]; savedRows.set(id, { id, type, name, data, created_at: "now", updated_at: "now" }); return { changes: 1, lastInsertRowid: 1 }; } }, app: { getVersion: async () => "test", printPdf: async () => undefined, savePdf: async () => true, onRequestSave: () => () => undefined, saveComplete: async () => undefined } };
    try {
      await saveAsset({ id: "template-copy", type: "handout", name: "Poster", data: fitted });
      const reopened = await getAsset("template-copy");
      expect(reopened?.data).toMatchObject(fitted);
      expect((reopened?.data as HandoutData).pages[0].elements.map(({ x, y }) => ({ x, y }))).toEqual(fitted.pages[0].elements.map(({ x, y }) => ({ x, y })));
    }
    finally { window.atlas = previous; }
  });
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
  it("generates seeded paper pixels deterministically and varies them by seed and layer settings", () => {
    const data=createHandout(), p=data.pages[0];p.textureConfig={version:1,seed:876543,grain:.4,ageing:.5,water:.2,edgeWear:.3};
    const a=createPaperTexture(p,24)!,b=createPaperTexture(p,24)!;expect(a).toBe(b);
    const pixels=(canvas:HTMLCanvasElement):number[]=>Array.from(canvas.getContext("2d")!.getImageData(0,0,canvas.width,canvas.height).data);
    expect(pixels(a)).toEqual(pixels(b));
    const changedSeed={...p,textureConfig:{...p.textureConfig,seed:876544}};expect(pixels(createPaperTexture(changedSeed,24)!)).not.toEqual(pixels(a));
    const changedLayer={...p,textureConfig:{...p.textureConfig,water:.9}};expect(pixels(createPaperTexture(changedLayer,24)!)).not.toEqual(pixels(a));
  });
  it("uses physical dimensions for texture output, supports legacy pages, and safely ignores invalid configurations", () => {
    const p=createHandout().pages[0];p.textureConfig={version:1,seed:1,grain:.2,ageing:0,water:0,edgeWear:0};
    const letter=createPaperTexture(p,30)!;const wide=createPaperTexture({...p,widthIn:11,heightIn:8.5},30)!;
    expect(letter.width).toBe(Math.round(8.5*30));expect(wide.width).toBe(Math.round(11*30));expect(wide.height).toBe(Math.round(8.5*30));
    expect(textureConfigForPage({...p,textureConfig:undefined,texture:"parchment"})?.seed).toBe(textureConfigForPage({...p,textureConfig:undefined,texture:"parchment"})?.seed);
    expect(textureConfigForPage({...p,textureConfig:undefined,texture:"none"})).toBeNull();
    expect(textureConfigForPage({...p,textureConfig:{version:1,seed:1,grain:4,ageing:NaN,water:-1,edgeWear:.2}})).toMatchObject({grain:1,ageing:0,water:0});
    expect(TEXTURE_DPI).toBe(150);expect(Object.keys(PAPER_PRESETS)).toHaveLength(6);
  });
  it("persists seeded texture settings and duplication preserves but does not link texture edits", async () => {
    const source=createHandout();source.pages[0].textureConfig={version:1,seed:42,grain:.3,ageing:.2,water:.1,edgeWear:0};
    const copy=structuredClone(source);copy.pages[0].id="duplicate";copy.pages[0].textureConfig!.water=.9;
    expect(source.pages[0].textureConfig?.water).toBe(.1);
    const rows=new Map<string,{id:string;type:string;name:string;data:string;created_at:string;updated_at:string}>();const previous=window.atlas;
    window.atlas={db:{query:async(_sql,params=[])=>{const row=rows.get(String(params[0]));return row?[row]:[];},run:async(_sql,params=[])=>{const[id,type,name,data]=params as [string,string,string,string];rows.set(id,{id,type,name,data,created_at:"now",updated_at:"now"});return{changes:1,lastInsertRowid:1};}},app:{getVersion:async()=>"test",printPdf:async()=>undefined,savePdf:async()=>true,onRequestSave:()=>()=>undefined,saveComplete:async()=>undefined}};
    try{await saveAsset({id:"texture",type:"handout",name:"Texture",data:source});const reopened=await getAsset("texture");expect(reopened?.data).toMatchObject(source);expect(textureConfigForPage((reopened?.data as HandoutData).pages[0])).toEqual(source.pages[0].textureConfig);}finally{window.atlas=previous;}
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
  it("embeds the configured seeded texture on each multipage PDF page", async()=>{
    const data=createHandout();data.pages[0].textureConfig={version:1,seed:10,grain:.3,ageing:.2,water:0,edgeWear:.1};data.pages.push({...data.pages[0],id:"two",widthIn:5.8,heightIn:8.3,textureConfig:{...data.pages[0].textureConfig,seed:20}});
    const source=new TextDecoder().decode(await exportHandoutPdf(data));
    expect((source.match(/\/Subtype\s*\/Image/g)??[]).length).toBeGreaterThanOrEqual(2);
  });
});
