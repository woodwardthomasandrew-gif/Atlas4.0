import path from "node:path";
import fs from "node:fs";
import initSqlJs, { Database } from "sql.js";

/**
 * Seed data for the built-in reusable statblock component library.
 * Small, curated, illustrative set — not an exhaustive 5e database.
 * Ids are fixed strings (not UUIDs) so re-seeding is idempotent and
 * the seed migration only ever runs once per database file.
 */
interface BuiltinComponentSeed {
  id: string;
  componentType: string;
  name: string;
  description: string;
  tags: string[];
  data: Record<string, unknown>;
}

const BUILTIN_COMPONENTS: BuiltinComponentSeed[] = [
  {
    id: "builtin-multiattack",
    componentType: "action",
    name: "Multiattack",
    description: "The creature makes multiple attacks.",
    tags: ["combat"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-pack-tactics",
    componentType: "trait",
    name: "Pack Tactics",
    description:
      "The creature has advantage on an attack roll against a creature if at least one of the creature's allies is within 5 feet of the creature and the ally isn't incapacitated.",
    tags: ["pack", "advantage"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-keen-smell",
    componentType: "trait",
    name: "Keen Smell",
    description: "The creature has advantage on Wisdom (Perception) checks that rely on smell.",
    tags: ["senses"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-keen-sight",
    componentType: "trait",
    name: "Keen Sight",
    description: "The creature has advantage on Wisdom (Perception) checks that rely on sight.",
    tags: ["senses"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-darkvision",
    componentType: "trait",
    name: "Darkvision",
    description:
      "The creature can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light. It can't discern color in darkness, only shades of gray.",
    tags: ["senses"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-bite",
    componentType: "action",
    name: "Bite",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: piercing damage.",
    tags: ["weapon", "natural"],
    data: {
      attackBonus: 4,
      damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" },
      saveDC: null,
      extraAttacksCount: null
    }
  },
  {
    id: "builtin-claw",
    componentType: "action",
    name: "Claw",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: slashing damage.",
    tags: ["weapon", "natural"],
    data: {
      attackBonus: 4,
      damage: { diceCount: 1, diceType: "d4", bonus: 2, damageType: "slashing" },
      saveDC: null,
      extraAttacksCount: null
    }
  },
  {
    id: "builtin-longsword",
    componentType: "action",
    name: "Longsword",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: slashing damage.",
    tags: ["weapon", "martial"],
    data: {
      attackBonus: 4,
      damage: { diceCount: 1, diceType: "d8", bonus: 2, damageType: "slashing" },
      saveDC: null,
      extraAttacksCount: null
    }
  },
  {
    id: "builtin-shortbow",
    componentType: "action",
    name: "Shortbow",
    description: "Ranged Weapon Attack: range 80/320 ft., one target. Hit: piercing damage.",
    tags: ["weapon", "martial", "ranged"],
    data: {
      attackBonus: 4,
      damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" },
      saveDC: null,
      extraAttacksCount: null
    }
  },
  {
    id: "builtin-frightful-presence",
    componentType: "action",
    name: "Frightful Presence",
    description:
      "Each creature of the DM's choice within 120 feet of the creature and aware of it must succeed on a Wisdom saving throw or become frightened for 1 minute.",
    tags: ["fear", "aoe"],
    data: { attackBonus: null, damage: null, saveDC: 13, extraAttacksCount: null }
  },
  {
    id: "builtin-legendary-resistance",
    componentType: "legendaryAction",
    name: "Legendary Resistance",
    description: "If the creature fails a saving throw, it can choose to succeed instead.",
    tags: ["defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  }
];

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

    /**
     * Generic reusable-component library (Atlas 4.0 Part 1). Lives in core
     * rather than a plugin because it's designed to eventually back
     * component types across multiple asset types (spell effects, item
     * properties, etc.) — see src/app/registry/componentTypeRegistry.ts.
     * Component-type-specific structured fields (attack bonus, damage,
     * save DC, ...) are stored opaquely in the `data` JSON column; core
     * and this migration don't need to know their shape.
     */
    this.applyMigration("0003_create_components_table", () => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS components (
          id TEXT PRIMARY KEY,
          component_type TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          tags TEXT NOT NULL DEFAULT '[]',
          is_builtin INTEGER NOT NULL DEFAULT 0,
          data TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_components_type ON components(component_type);`);
    });

    this.applyMigration("0004_seed_builtin_components", () => {
      for (const c of BUILTIN_COMPONENTS) {
        this.db.run(
          `INSERT INTO components (id, component_type, name, description, tags, is_builtin, data)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [c.id, c.componentType, c.name, c.description, JSON.stringify(c.tags), JSON.stringify(c.data)]
        );
      }
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
