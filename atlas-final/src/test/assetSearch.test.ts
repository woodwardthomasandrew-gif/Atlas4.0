import { describe, expect, it } from "vitest";
import { filterAssetsByName } from "@app/search/assetSearch";

const assets = [
  { name: "Ancient Red Dragon" },
  { name: "Young Dragon" },
  { name: "Dragon Turtle" },
  { name: "Necrotic Blast" }
];

describe("filterAssetsByName", () => {
  it("returns every asset for an empty or whitespace-only query", () => {
    expect(filterAssetsByName(assets, "")).toEqual(assets);
    expect(filterAssetsByName(assets, "  ")).toEqual(assets);
  });

  it("matches partial names without regard to case", () => {
    expect(filterAssetsByName(assets, "DRAGON")).toEqual(assets.slice(0, 3));
    expect(filterAssetsByName(assets, "nec")).toEqual([assets[3]]);
  });

  it("returns no results when no name matches", () => {
    expect(filterAssetsByName(assets, "wizard")).toEqual([]);
  });
});
