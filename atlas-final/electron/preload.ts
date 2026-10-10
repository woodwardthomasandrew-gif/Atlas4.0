import { contextBridge, ipcRenderer } from "electron";

/**
 * The Atlas bridge is the entire surface area the renderer has onto
 * Node/Electron. It is deliberately generic (raw SQL query/run + app
 * metadata) so the core app — and future plugins — never need main-process
 * changes to add new asset types.
 */
const atlasBridge = {
  db: {
    query: (sql: string, params: unknown[] = []) =>
      ipcRenderer.invoke("atlas:db:query", sql, params),
    run: (sql: string, params: unknown[] = []) =>
      ipcRenderer.invoke("atlas:db:run", sql, params)
  },
  app: {
    getVersion: () => ipcRenderer.invoke("atlas:app:getVersion"),
    printPdf: (pdf: Uint8Array) => ipcRenderer.invoke("atlas:app:print-pdf", pdf),
    savePdf: (pdf: Uint8Array, name: string) => ipcRenderer.invoke("atlas:app:save-pdf", pdf, name),
    onRequestSave: (listener: () => void | Promise<void>) => { const handler = (): void => { void listener(); }; ipcRenderer.on("atlas:app:request-save", handler); return () => ipcRenderer.removeListener("atlas:app:request-save", handler); },
    saveComplete: () => ipcRenderer.invoke("atlas:app:save-complete")
  }
};

contextBridge.exposeInMainWorld("atlas", atlasBridge);

export type AtlasBridge = typeof atlasBridge;
