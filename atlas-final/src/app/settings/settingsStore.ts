/**
 * Generic settings framework.
 *
 * Core and future plugins both read/write settings through this same
 * key/value API. Keys should be namespaced (e.g. "atlas.theme",
 * "plugin.creatures.defaultCr") to avoid collisions. Values are stored
 * as JSON strings in the `settings` table and parsed on read.
 */

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const rows = (await window.atlas.db.query(
    "SELECT value FROM settings WHERE key = ?",
    [key]
  )) as Array<{ value: string }>;

  if (rows.length === 0) return fallback;

  try {
    return JSON.parse(rows[0].value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  await window.atlas.db.run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, serialized]
  );
}

export async function deleteSetting(key: string): Promise<void> {
  await window.atlas.db.run("DELETE FROM settings WHERE key = ?", [key]);
}
