/**
 * Generic persistence for the reusable-component library (Part 1).
 *
 * Mirrors assetStore.ts's shape deliberately: core knows how to list,
 * search, save, and delete components, but has no opinion about what a
 * given componentType's `data` payload looks like — that's up to whatever
 * plugin (currently only the Creature Builder) reads/writes it.
 *
 * Built-in components (isBuiltin: true) are seeded once by the main-process
 * migration and are enforced read-only here: saveCustomComponent and
 * deleteCustomComponent both refuse to touch a built-in id.
 */

export interface ComponentRecord {
  id: string;
  componentType: string;
  name: string;
  description: string;
  tags: string[];
  isBuiltin: boolean;
  data: unknown;
  createdAt: string;
  updatedAt: string;
}

interface ComponentRow {
  id: string;
  component_type: string;
  name: string;
  description: string;
  tags: string;
  is_builtin: number;
  data: string;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: ComponentRow): ComponentRecord {
  return {
    id: row.id,
    componentType: row.component_type,
    name: row.name,
    description: row.description,
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
    isBuiltin: row.is_builtin === 1,
    data: row.data ? JSON.parse(row.data) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listComponents(componentType?: string): Promise<ComponentRecord[]> {
  const rows = componentType
    ? ((await window.atlas.db.query(
        "SELECT * FROM components WHERE component_type = ? ORDER BY is_builtin DESC, name ASC",
        [componentType]
      )) as ComponentRow[])
    : ((await window.atlas.db.query(
        "SELECT * FROM components ORDER BY is_builtin DESC, name ASC"
      )) as ComponentRow[]);
  return rows.map(rowToRecord);
}

/** Case-insensitive search over name, description, and tags, scoped to a component type. */
export async function searchComponents(
  componentType: string,
  query: string
): Promise<ComponentRecord[]> {
  const all = await listComponents(componentType);
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export async function getComponent(id: string): Promise<ComponentRecord | null> {
  const rows = (await window.atlas.db.query("SELECT * FROM components WHERE id = ?", [
    id
  ])) as ComponentRow[];
  const row = rows[0];
  return row ? rowToRecord(row) : null;
}

export interface SaveCustomComponentInput {
  id?: string;
  componentType: string;
  name: string;
  description: string;
  tags?: string[];
  data?: unknown;
}

/** Creates or updates a custom (non-built-in) component. Refuses to touch built-ins. */
export async function saveCustomComponent(input: SaveCustomComponentInput): Promise<ComponentRecord> {
  const id = input.id ?? crypto.randomUUID();

  const existing = await getComponent(id);
  if (existing?.isBuiltin) {
    throw new Error("Built-in components cannot be modified.");
  }

  await window.atlas.db.run(
    `INSERT INTO components (id, component_type, name, description, tags, is_builtin, data, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       tags = excluded.tags,
       data = excluded.data,
       updated_at = datetime('now')`,
    [
      id,
      input.componentType,
      input.name,
      input.description,
      JSON.stringify(input.tags ?? []),
      JSON.stringify(input.data ?? {})
    ]
  );

  const saved = await getComponent(id);
  if (!saved) throw new Error("Failed to save component.");
  return saved;
}

/** Deletes a custom component. Refuses to touch built-ins (no-ops if the id doesn't exist). */
export async function deleteCustomComponent(id: string): Promise<void> {
  const existing = await getComponent(id);
  if (!existing) return;
  if (existing.isBuiltin) {
    throw new Error("Built-in components cannot be deleted.");
  }
  await window.atlas.db.run("DELETE FROM components WHERE id = ?", [id]);
}
