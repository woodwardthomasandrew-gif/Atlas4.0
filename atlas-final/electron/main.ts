import { app, BrowserWindow, ipcMain } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AtlasDatabase } from "./database";

const isDev = process.env.ATLAS_DEV === "1";

let mainWindow: BrowserWindow | null = null;
let db: AtlasDatabase | null = null;
let isClosing = false;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#111214",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("close", (event) => {
    if (isClosing) return;
    event.preventDefault();
    mainWindow?.webContents.send("atlas:app:request-save");
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Registers all IPC handlers exposed to the renderer via preload.
 * This is the ONLY boundary through which the renderer touches the
 * filesystem or database. Handlers are intentionally generic — the
 * core app has no knowledge of specific asset types.
 */
function registerIpcHandlers(database: AtlasDatabase): void {
  ipcMain.handle("atlas:db:query", (_event, sql: string, params: unknown[]) => {
    return database.query(sql, params);
  });

  ipcMain.handle("atlas:db:run", (_event, sql: string, params: unknown[]) => {
    return database.run(sql, params);
  });

  ipcMain.handle("atlas:app:getVersion", () => {
    return app.getVersion();
  });
  ipcMain.handle("atlas:app:print-pdf", async (_event, pdf: Uint8Array) => {
    if (!pdf || pdf.byteLength === 0) {
      throw new Error("Cannot print an empty PDF.");
    }

    const tempPdfPath = path.join(app.getPath("temp"), `atlas-print-${crypto.randomUUID()}.pdf`);

    try {
      await fs.writeFile(tempPdfPath, Buffer.from(pdf));
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      });

      try {
        await printWindow.loadFile(tempPdfPath);
        await new Promise<void>((resolve, reject) => {
          printWindow.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
            if (success) resolve();
            else reject(new Error(failureReason || "Printing was cancelled."));
          });
        });
      } finally {
        if (!printWindow.isDestroyed()) printWindow.destroy();
      }
    } finally {
      await fs.rm(tempPdfPath, { force: true });
    }
  });
  ipcMain.handle("atlas:app:save-complete", () => {
    if (!mainWindow || isClosing) return;
    isClosing = true;
    mainWindow.close();
  });
}

app.whenReady().then(async () => {
  const userDataPath = app.getPath("userData");
  db = await AtlasDatabase.init(path.join(userDataPath, "atlas.db"));
  db.migrate();

  registerIpcHandlers(db);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  db?.close();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
