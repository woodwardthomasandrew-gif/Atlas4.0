/**
 * Generic asset persistence.
 *
 * This module reads and writes rows in the `assets` table without any
 * knowledge of what `type` means or what shape `data` takes — that is
 * entirely up to whichever plugin owns a given asset type. Core only
 * needs enough to count, list, and CRUD generically.
 */

export interface AssetRecord {
  id: string;
  type: string;
  name: string;
  data: unknown;
  created_at: string;
  updated_at: string;
}

interface AssetRow {
  id: string;
  type: string;
  name: string;
  data: string;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: AssetRow): AssetRecord {
  return { ...row, data: JSON.parse(row.data) };
}

export async function getAssetCount(): Promise<number> {
  const rows = (await window.atlas.db.query(
    "SELECT COUNT(*) as count FROM assets"
  )) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

export async function getAsset(id: string): Promise<AssetRecord | null> {
  const rows = (await window.atlas.db.query("SELECT * FROM assets WHERE id = ?", [id])) as AssetRow[];
  const row = rows[0];
  return row ? rowToRecord(row) : null;
}

export async function listAssets(type?: string): Promise<AssetRecord[]> {
  const rows = type
    ? ((await window.atlas.db.query(
        "SELECT * FROM assets WHERE type = ? ORDER BY updated_at DESC",
        [type]
      )) as AssetRow[])
    : ((await window.atlas.db.query(
        "SELECT * FROM assets ORDER BY updated_at DESC"
      )) as AssetRow[]);
  return rows.map(rowToRecord);
}

export async function saveAsset(record: {
  id: string;
  type: string;
  name: string;
  data: unknown;
}): Promise<void> {
  await window.atlas.db.run(
    `INSERT INTO assets (id, type, name, data, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       data = excluded.data,
       updated_at = datetime('now')`,
    [record.id, record.type, record.name, JSON.stringify(record.data)]
  );
}

export async function deleteAsset(id: string): Promise<void> {
  await window.atlas.db.run("DELETE FROM assets WHERE id = ?", [id]);
}
