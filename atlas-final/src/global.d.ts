export {};

/**
 * Shape of the bridge exposed by electron/preload.ts.
 * Kept minimal and generic on purpose — see electron/preload.ts.
 */
interface AtlasBridge {
  db: {
    query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
    run: (
      sql: string,
      params?: unknown[]
    ) => Promise<{ changes: number; lastInsertRowid: number | bigint }>;
  };
  app: {
    getVersion: () => Promise<string>;
    printPdf: (pdf: Uint8Array) => Promise<void>;
    savePdf: (pdf: Uint8Array, name: string) => Promise<boolean>;
    onRequestSave: (listener: () => void | Promise<void>) => () => void;
    saveComplete: () => Promise<void>;
  };
}

declare global {
  interface Window {
    atlas: AtlasBridge;
  }
}
