/**
 * Global search framework.
 *
 * Core provides the aggregation point only. It ships with zero search
 * providers registered, so searching returns no results until plugins
 * register themselves (e.g. a "creatures" provider that searches the
 * creature asset table).
 */

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  assetType: string;
  onSelect: () => void;
}

export type SearchProvider = (query: string) => Promise<SearchResult[]>;

const providers = new Map<string, SearchProvider>();

export function registerSearchProvider(id: string, provider: SearchProvider): void {
  if (providers.has(id)) {
    throw new Error(`Search provider "${id}" is already registered.`);
  }
  providers.set(id, provider);
}

export function unregisterSearchProvider(id: string): void {
  providers.delete(id);
}

/**
 * Runs the query against every registered provider and merges results.
 * With no providers registered (the 4.0 default), this always resolves
 * to an empty array.
 */
export async function search(query: string): Promise<SearchResult[]> {
  if (query.trim().length === 0) return [];

  const results = await Promise.all(
    Array.from(providers.values()).map((provider) => provider(query))
  );

  return results.flat();
}
