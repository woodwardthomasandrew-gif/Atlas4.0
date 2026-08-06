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
    getVersion: () => ipcRenderer.invoke("atlas:app:getVersion")
  }
};

contextBridge.exposeInMainWorld("atlas", atlasBridge);

export type AtlasBridge = typeof atlasBridge;
