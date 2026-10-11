import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

vi.mock("@app/save/SaveProvider", () => ({
  useSaveContext: () => ({ notifySaved: vi.fn() }),
  useAutosave: vi.fn()
}));
vi.mock("@app/shortcuts/ShortcutProvider", () => ({ useShortcutAction: vi.fn() }));

const storedAssets = new Map<string, { id: string; type: string; name: string; data: string; created_at: string; updated_at: string }>();

function installBridge(): void {
  storedAssets.clear();
  (globalThis as any).window.atlas = {
    db: {
      query: vi.fn(async (sql: string, params: unknown[] = []) => {
        if (sql.includes("FROM assets WHERE id = ?")) return [...storedAssets.values()].filter((row) => row.id === params[0]);
        if (sql.includes("FROM assets WHERE type = ?")) return [...storedAssets.values()].filter((row) => row.type === params[0]);
        if (sql.includes("FROM assets")) return [...storedAssets.values()];
        throw new Error(`Unhandled query: ${sql}`);
      }),
      run: vi.fn(async (sql: string, params: unknown[] = []) => {
        if (sql.startsWith("INSERT INTO assets")) {
          const [id, type, name, data] = params as [string, string, string, string];
          const prior = storedAssets.get(id);
          storedAssets.set(id, { id, type, name, data, created_at: prior?.created_at ?? "now", updated_at: "now" });
          return { changes: 1 };
        }
        if (sql.startsWith("DELETE FROM assets")) { storedAssets.delete(String(params[0])); return { changes: 1 }; }
        throw new Error(`Unhandled run: ${sql}`);
      })
    }
  };
}

describe("creature templates", () => {
  beforeAll(async () => {
    const { registerCreaturePlugin } = await import("@plugins/creature");
    registerCreaturePlugin();
  });

  beforeEach(async () => {
    installBridge();
  });

  it("discovers the dragon chassis and role foundations with isolated nested IDs and data", async () => {
    const { listAssetTemplates, instantiateAssetTemplate } = await import("@app/templates/templateCatalog");
    const { validateCreature } = await import("@plugins/creature/validate");
    const templates = listAssetTemplates("creature");
    const dragonTemplates = templates.filter((template) => template.category === "Dragon chassis");
    expect(dragonTemplates.map((template) => template.name)).toEqual([
      "Dragon Wyrmling — Blank Template", "Young Dragon — Blank Template", "Adult Dragon — Blank Template", "Ancient Dragon — Blank Template"
    ]);
    expect(templates).toHaveLength(16);
    expect(templates.filter((template) => template.category === "Creature foundation").map((template) => template.name)).toEqual([
      "Basic Soldier / Guard — Blank Template", "Heavy / Brute — Blank Template", "Skirmisher — Blank Template", "Ranged Attacker — Blank Template", "Spellcaster — Blank Template", "Predatory Beast — Blank Template", "Monstrous Creature — Blank Template", "Controller — Blank Template", "Commander — Blank Template", "Elite — Blank Template", "Legendary Monster — Blank Template", "Artillery / Heavy Weapons — Blank Template"
    ]);
    const targetCrById: Record<string, string> = {
      "creature-basic-soldier-guard": "1/2", "creature-heavy-brute": "2", "creature-skirmisher": "1", "creature-ranged-attacker": "1/2",
      "creature-spellcaster": "2", "creature-predatory-beast": "1/2", "creature-monstrous-creature": "2", "creature-controller": "2",
      "creature-commander": "3", "creature-elite": "4", "creature-legendary-monster": "8", "creature-artillery-heavy-weapons": "2"
    };
    for (const [id, cr] of Object.entries(targetCrById)) {
      expect(instantiateAssetTemplate<any>(id, "creature").challengeRating).toBe(cr);
    }

    const allNestedIds: string[] = [];
    for (const template of templates) {
      const first = instantiateAssetTemplate<any>(template.id, "creature");
      const second = instantiateAssetTemplate<any>(template.id, "creature");
      expect(validateCreature(first).valid).toBe(true);
      expect(first.creatureType).toBe(template.category === "Dragon chassis" ? "dragon" : "customize creature type");
      expect(first.actions.length).toBeGreaterThan(0);
      const nestedCollections = ["traits", "actions", "bonusActions", "reactions", "legendaryActions", "lairActions", "mythicActions", "equipment", "lootTable"];
      const firstIds = nestedCollections.flatMap((key) => first[key].map((entry: { id: string }) => entry.id));
      const secondIds = nestedCollections.flatMap((key) => second[key].map((entry: { id: string }) => entry.id));
      expect(new Set([...firstIds, ...secondIds]).size).toBe(firstIds.length + secondIds.length);
      allNestedIds.push(...firstIds);
      first.actions[0].name = "Edited only in this creature";
      first.abilities.str = 1;
      expect(second.actions[0].name).not.toBe("Edited only in this creature");
      expect(instantiateAssetTemplate<any>(template.id, "creature").actions[0].name).not.toBe("Edited only in this creature");
    }
    expect(new Set(allNestedIds).size).toBe(allNestedIds.length);
  });

  it("supports blank creation and safely rejects missing, wrong-type, and invalid templates", async () => {
    const { instantiateAssetTemplate, registerAssetTemplates } = await import("@app/templates/templateCatalog");
    const { createDefaultCreatureData } = await import("@plugins/creature/schema");
    expect(createDefaultCreatureData().creatureType).toBe("");
    expect(() => instantiateAssetTemplate("does-not-exist", "creature")).toThrow(/not found/i);
    expect(() => instantiateAssetTemplate("dragon-wyrmling-blank", "spell")).toThrow(/not a spell/i);
    registerAssetTemplates([{ id: "test-invalid-template", name: "Invalid", description: "", assetType: "creature", category: "test", schemaVersion: 1, initialData: {}, validate: () => false }]);
    expect(() => instantiateAssetTemplate("test-invalid-template", "creature")).toThrow(/invalid/i);
    registerAssetTemplates([{ id: "test-throwing-template", name: "Invalid", description: "", assetType: "creature", category: "test", schemaVersion: 1, initialData: {}, validate: () => { throw new Error("bad schema"); } }]);
    expect(() => instantiateAssetTemplate("test-throwing-template", "creature")).toThrow(/invalid/i);
  });

  it("creates a creature through the maker, saves it as an ordinary asset, and reopens it", async () => {
    const user = userEvent.setup();
    const { CreatureListPage } = await import("@plugins/creature/pages/CreatureListPage");
    const { CreatureEditPage } = await import("@plugins/creature/pages/CreatureEditPage");
    render(
      <MemoryRouter initialEntries={["/creatures"]}>
        <Routes>
          <Route path="/creatures" element={<CreatureListPage />} />
          <Route path="/creatures/:id" element={<CreatureEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    await user.click(await screen.findByRole("button", { name: /create from template/i }));
    await user.click(screen.getByRole("link", { name: /young dragon — blank template/i }));
    expect(await screen.findByRole("heading", { name: "New Creature" })).toBeInTheDocument();
    const nameField = screen.getByText("Name").closest("label")!;
    const nameInput = nameField.querySelector("input")!;
    expect(nameInput).toHaveValue("Young Dragon (Homebrew)");
    await user.clear(nameInput);
    await user.type(nameInput, "Siltwing");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await screen.findByRole("link", { name: /siltwing/i });
    expect(storedAssets.size).toBe(1);
    const saved = [...storedAssets.values()][0];
    expect(saved.type).toBe("creature");
    const savedData = JSON.parse(saved.data);
    expect(savedData.size).toBe("large");
    expect(savedData.actions.map((entry: { name: string }) => entry.name)).toContain("Breath Weapon");

    await user.click(screen.getByRole("link", { name: /siltwing/i }));
    expect(await screen.findByRole("heading", { name: "Edit Creature" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue("Siltwing")).toBeInTheDocument());
    expect(screen.getByDisplayValue("Breath Weapon")).toBeInTheDocument();
    expect(storedAssets.size).toBe(1); // Built-in template definitions never entered the library.
    fireEvent.change(screen.getByDisplayValue("Siltwing"), { target: { value: "Reopened & edited" } });
    expect(JSON.parse(storedAssets.get(saved.id)!.data).actions).toEqual(savedData.actions);
  });

  it("still opens the existing blank-creature workflow", async () => {
    const { CreatureEditPage } = await import("@plugins/creature/pages/CreatureEditPage");
    render(
      <MemoryRouter initialEntries={["/creatures/new"]}>
        <Routes><Route path="/creatures/:id" element={<CreatureEditPage />} /></Routes>
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: "New Creature" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Creature name")).toHaveValue("");
    expect(storedAssets.size).toBe(0);
  });
});
