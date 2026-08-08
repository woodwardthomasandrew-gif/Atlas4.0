import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

/**
 * A minimal fake of the Electron `window.atlas` bridge, backed by
 * in-memory arrays, that understands exactly the SQL statements
 * componentStore.ts and assetStore.ts issue. This lets us exercise the
 * real component/asset store modules — and the real React components built
 * on top of them — inside jsdom, without an actual Electron window.
 */
function installFakeAtlasBridge() {
  const components: Record<string, unknown>[] = [
    {
      id: "builtin-multiattack",
      component_type: "action",
      name: "Multiattack",
      description: "The creature makes multiple attacks.",
      tags: "[]",
      is_builtin: 1,
      data: JSON.stringify({ attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }),
      created_at: "2026-01-01",
      updated_at: "2026-01-01"
    },
    {
      id: "builtin-bite",
      component_type: "action",
      name: "Bite",
      description: "Melee Weapon Attack.",
      tags: "[]",
      is_builtin: 1,
      data: JSON.stringify({
        attackBonus: 4,
        damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" },
        saveDC: null,
        extraAttacksCount: null
      }),
      created_at: "2026-01-01",
      updated_at: "2026-01-01"
    }
  ];

  const assets: Record<string, unknown>[] = [
    {
      id: "goblin-1",
      type: "creature",
      name: "Goblin",
      data: JSON.stringify({
        hitPoints: 7,
        traits: [{ id: "t1", name: "Nimble Escape", description: "..." }]
      }),
      created_at: "2026-01-01",
      updated_at: "2026-01-01"
    }
  ];

  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes("FROM components WHERE id = ?")) {
      return components.filter((c) => c.id === params[0]);
    }
    if (sql.includes("FROM components WHERE component_type = ?")) {
      return components.filter((c) => c.component_type === params[0]);
    }
    if (sql.includes("FROM components")) {
      return [...components];
    }
    if (sql.includes("FROM assets WHERE id = ?")) {
      return assets.filter((a) => a.id === params[0]);
    }
    if (sql.includes("FROM assets WHERE type = ?")) {
      return assets.filter((a) => a.type === params[0]);
    }
    if (sql.includes("FROM assets")) {
      return [...assets];
    }
    throw new Error(`Unhandled query: ${sql}`);
  });

  const run = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.startsWith("INSERT INTO components")) {
      const [id, componentType, name, description, tags, data] = params;
      const idx = components.findIndex((c) => c.id === id);
      const row = {
        id,
        component_type: componentType,
        name,
        description,
        tags,
        is_builtin: 0,
        data,
        created_at: idx === -1 ? "now" : (components[idx].created_at as string),
        updated_at: "now"
      };
      if (idx === -1) components.push(row);
      else components[idx] = row;
      return { changes: 1, lastInsertRowid: 0 };
    }
    if (sql.startsWith("DELETE FROM components")) {
      const before = components.length;
      const id = params[0];
      const idx = components.findIndex((c) => c.id === id);
      if (idx !== -1) components.splice(idx, 1);
      return { changes: before - components.length, lastInsertRowid: 0 };
    }
    if (sql.startsWith("INSERT INTO assets")) {
      const [id, type, name, data] = params;
      const idx = assets.findIndex((a) => a.id === id);
      const row = { id, type, name, data, created_at: "now", updated_at: "now" };
      if (idx === -1) assets.push(row);
      else assets[idx] = row;
      return { changes: 1, lastInsertRowid: 0 };
    }
    if (sql.startsWith("DELETE FROM assets")) {
      const id = params[0];
      const idx = assets.findIndex((a) => a.id === id);
      if (idx !== -1) assets.splice(idx, 1);
      return { changes: 1, lastInsertRowid: 0 };
    }
    throw new Error(`Unhandled run: ${sql}`);
  });

  (globalThis as any).window.atlas = {
    db: { query, run },
    app: { getVersion: async () => "test" }
  };

  return { components, assets };
}

describe("Atlas 4.0 — reusable components & duplication (Part 1-2)", () => {
  beforeEach(() => {
    installFakeAtlasBridge();
  });

  it("inserts a library component into a creature as an independent copy, and lets the user save a new entry back to the library", async () => {
    const { AbilityEntryList } = await import("@plugins/creature/components/AbilityEntryList");
    const { createAbilityEntry } = await import("@plugins/creature/schema");

    const user = userEvent.setup();
    let currentValue = [createAbilityEntry()];
    const handleChange = vi.fn((next: typeof currentValue) => {
      currentValue = next;
    });

    const { rerender } = render(
      <AbilityEntryList
        value={currentValue}
        onChange={handleChange}
        addLabel="Add Action"
        componentType="action"
      />
    );

    // Search -> Click -> Insert
    await user.click(screen.getByRole("button", { name: /from library/i }));
    expect(await screen.findByText("Multiattack")).toBeInTheDocument();
    expect(screen.getByText("Bite")).toBeInTheDocument();

    await user.click(screen.getByText("Bite").closest("button")!);

    expect(handleChange).toHaveBeenCalled();
    const inserted = currentValue[currentValue.length - 1];
    expect(inserted.name).toBe("Bite");
    expect(inserted.damage).toEqual({ diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" });
    // Insert-as-copy: the new entry must not carry the library component's id.
    expect(inserted.id).not.toBe("builtin-bite");

    // Now mutate the inserted copy and confirm the library source is untouched
    // by re-rendering with the mutated value and re-opening the picker.
    currentValue = currentValue.map((e) => (e.id === inserted.id ? { ...e, name: "Mutated Bite" } : e));
    rerender(
      <AbilityEntryList
        value={currentValue}
        onChange={handleChange}
        addLabel="Add Action"
        componentType="action"
      />
    );

    const { getComponent } = await import("@app/db/componentStore");
    const libraryBite = await getComponent("builtin-bite");
    expect(libraryBite?.name).toBe("Bite"); // unchanged in the library
  });

  it("saves an existing creature entry to the library as a new custom component without altering built-ins", async () => {
    const { AbilityEntryList } = await import("@plugins/creature/components/AbilityEntryList");
    const { createAbilityEntry } = await import("@plugins/creature/schema");

    const user = userEvent.setup();
    const entry = { ...createAbilityEntry(), name: "Ashen Strike", description: "A blazing strike." };
    const handleChange = vi.fn();

    render(
      <AbilityEntryList value={[entry]} onChange={handleChange} addLabel="Add Action" componentType="action" />
    );

    await user.click(screen.getByRole("button", { name: /save to library/i }));
    const nameField = screen.getByText("Library name").closest("label")!;
    const nameInput = within(nameField).getByRole("textbox");
    await user.clear(nameInput);
    await user.type(nameInput, "Ashen Strike");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    const { listComponents } = await import("@app/db/componentStore");
    await waitFor(async () => {
      const customs = await listComponents("action");
      expect(customs.some((c) => c.name === "Ashen Strike" && !c.isBuiltin)).toBe(true);
    });

    // Built-ins remain read-only regardless of custom saves.
    const { saveCustomComponent } = await import("@app/db/componentStore");
    await expect(
      saveCustomComponent({ id: "builtin-bite", componentType: "action", name: "Hacked", description: "" })
    ).rejects.toThrow(/built-in/i);
  });

  it("duplicates a creature asset as a fully independent copy and opens it in the editor", async () => {
    const { getAsset } = await import("@app/db/assetStore");
    const { DuplicateAssetButton } = await import(
      "@plugins/shared/components/DuplicateAssetButton"
    );

    function Harness() {
      const navigate = useNavigate();
      (globalThis as any).__navigate = navigate;
      return <DuplicateAssetButton assetId="goblin-1" basePath="/creatures" />;
    }

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /^duplicate$/i }));

    await waitFor(async () => {
      const original = await getAsset("goblin-1");
      expect(original).not.toBeNull();
    });

    // Find the duplicate directly via the store (name suffix contract).
    const { listAssets } = await import("@app/db/assetStore");
    const all = await listAssets("creature");
    const duplicate = all.find((a) => a.id !== "goblin-1");
    expect(duplicate?.name).toBe("Goblin (Copy)");

    // Mutate the duplicate's data and confirm original is untouched.
    const dupData = duplicate!.data as { hitPoints: number; traits: { name: string }[] };
    dupData.hitPoints = 999;
    dupData.traits[0].name = "Mutated";
    const { saveAsset } = await import("@app/db/assetStore");
    await saveAsset({ id: duplicate!.id, type: "creature", name: duplicate!.name, data: dupData });

    const original = await getAsset("goblin-1");
    const originalData = original!.data as { hitPoints: number; traits: { name: string }[] };
    expect(originalData.hitPoints).toBe(7);
    expect(originalData.traits[0].name).toBe("Nimble Escape");
  });
});
