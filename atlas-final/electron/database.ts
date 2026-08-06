import path from "node:path";
import fs from "node:fs";
import initSqlJs, { Database } from "sql.js";

/**
 * WebAssembly-based SQLite wrapper using sql.js.
 *
 * Atlas core only ever creates the `assets` table plus internal
 * bookkeeping (`_migrations`, `settings`). Asset PLUGINS are responsible
 * for their own schema (typically stored as validated JSON inside the
 * `assets.data` column, or via their own tables created through the same
 * query/run bridge). The core database layer has no knowledge of
 * creatures, spells, items, or any other concrete asset type.
 *
 * This version operates fully in-memory and serializes/deserializes
 * to/from the filesystem synchronously upon initialization and mutations.
 */
export class AtlasDatabase {
  private db: Database;
  private filePath: string;

  private constructor(db: Database, filePath: string) {
    this.db = db;
    this.filePath = filePath;
  }

  /**
   * Asynchronously initializes the sql.js database module and loads
   * the database file from disk if it exists.
   */
  static async init(filePath: string): Promise<AtlasDatabase> {
    const wasmPath = path.join(__dirname, "../node_modules/sql.js/dist/sql-wasm.wasm");
    const wasmBinary = fs.readFileSync(wasmPath);
    const SQL = await initSqlJs({ wasmBinary: wasmBinary.buffer as ArrayBuffer });

    let fileBuffer: Buffer | undefined;
    if (fs.existsSync(filePath)) {
      fileBuffer = fs.readFileSync(filePath);
    }

    const db = new SQL.Database(fileBuffer);
    db.run("PRAGMA foreign_keys = ON;");

    return new AtlasDatabase(db, filePath);
  }

  /**
   * Serializes the current in-memory database state and writes it to disk.
   */
  private save(): void {
    const data = this.db.export();
    fs.writeFileSync(this.filePath, Buffer.from(data));
  }

  migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    this.applyMigration("0001_create_assets_table", () => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          data TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);`);
    });

    this.applyMigration("0002_create_settings_table", () => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    });

    this.save();
  }

  private applyMigration(name: string, fn: () => void): void {
    const stmt = this.db.prepare("SELECT 1 FROM _migrations WHERE name = ?");
    stmt.bind([name]);
    const existing = stmt.step();
    stmt.free();

    if (existing) return;

    fn();
    this.db.run("INSERT INTO _migrations (name) VALUES (?)", [name]);
  }

  query(sql: string, params: unknown[] = []): unknown[] {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as any[]);
    const rows: unknown[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  run(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number | bigint } {
    this.db.run(sql, params as any[]);

    const res = this.db.exec("SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowid");
    const changes = (res[0]?.values[0][0] as number) ?? 0;
    const lastInsertRowid = (res[0]?.values[0][1] as number | bigint) ?? 0;

    this.save();
    return { changes, lastInsertRowid };
  }

  close(): void {
    this.db.close();
  }
}
