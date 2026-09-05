import type { AssetRecord } from "@app/db/assetStore";

/** Filters assets by their saved name using a case-insensitive partial match. */
export function filterAssetsByName<T extends Pick<AssetRecord, "name">>(
  assets: T[],
  query: string
): T[] {
  const term = query.trim().toLowerCase();
  if (term.length === 0) return assets;
  return assets.filter((asset) => asset.name.toLowerCase().includes(term));
}
