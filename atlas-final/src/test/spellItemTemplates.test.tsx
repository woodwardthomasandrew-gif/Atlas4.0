import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

vi.mock("@app/save/SaveProvider", () => ({ useSaveContext: () => ({ notifySaved: vi.fn() }), useAutosave: vi.fn() }));
vi.mock("@app/shortcuts/ShortcutProvider", () => ({ useShortcutAction: vi.fn() }));

type StoredAsset = { id: string; type: string; name: string; data: string; created_at: string; updated_at: string };
const storedAssets = new Map<string, StoredAsset>();

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
          const previous = storedAssets.get(id);
          storedAssets.set(id, { id, type, name, data, created_at: previous?.created_at ?? "now", updated_at: "now" });
          return { changes: 1 };
        }
        if (sql.startsWith("DELETE FROM assets")) { storedAssets.delete(String(params[0])); return { changes: 1 }; }
        throw new Error(`Unhandled run: ${sql}`);
      })
    }
  };
}

const spellCases = [
  ["spell-damage-foundation", "Damage Spell", "Custom Damage Spell"],
  ["spell-healing-foundation", "Healing Spell", "Custom Healing Spell"],
  ["spell-control-foundation", "Control Spell", "Custom Control Spell"],
  ["spell-utility-foundation", "Utility Spell", "Custom Utility Spell"],
  ["spell-summoning-foundation", "Summoning Spell", "Custom Summoning Spell"]
] as const;

const itemCases = [
  ["magic-item-weapon-foundation", "Magic Weapon", "Custom Magic Weapon"],
  ["magic-item-armour-foundation", "Magic Armour", "Custom Magic Armour"],
  ["magic-item-wondrous-foundation", "Wondrous Item", "Custom Wondrous Item"],
  ["magic-item-consumable-foundation", "Consumable", "Custom Consumable"],
  ["magic-item-charged-foundation", "Charged Item", "Custom Charged Item"]
] as const;

describe("spell and magic item templates", () => {
  beforeAll(async () => {
    const [{ registerSpellPlugin }, { registerMagicItemPlugin }] = await Promise.all([
      import("@plugins/spell"), import("@plugins/magic-item")
    ]);
    registerSpellPlugin();
    registerMagicItemPlugin();
  });

  beforeEach(() => installBridge());

  it("registers type-filtered resources with unique IDs and valid maker data", async () => {
    const { listAssetTemplates, instantiateAssetTemplate } = await import("@app/templates/templateCatalog");
    const { validateSpell } = await import("@plugins/spell/validate");
    const { validateMagicItem } = await import("@plugins/magic-item/validate");
    const spells = listAssetTemplates("spell");
    const items = listAssetTemplates("magic-item");
    expect(spells.map((template) => [template.id, template.name])).toEqual(spellCases.map(([id, name]) => [id, name]));
    expect(items.map((template) => [template.id, template.name])).toEqual(itemCases.map(([id, name]) => [id, name]));
    const allIds = [...spells, ...items].map((template) => template.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(new Set(listAssetTemplates().map((template) => template.assetType))).toEqual(new Set(["spell", "magic-item"]));

    for (const template of spells) {
      expect(template.assetType).toBe("spell");
      expect(validateSpell(instantiateAssetTemplate(template.id, "spell") as any).valid).toBe(true);
    }
    for (const template of items) {
      expect(template.assetType).toBe("magic-item");
      expect(validateMagicItem(instantiateAssetTemplate(template.id, "magic-item") as any).valid).toBe(true);
    }
    expect(listAssetTemplates("spell").every((template) => template.assetType === "spell")).toBe(true);
    expect(listAssetTemplates("magic-item").every((template) => template.assetType === "magic-item")).toBe(true);
  });

  it("keeps nested spell and item data independent from the source and other instances", async () => {
    const { getAssetTemplate, instantiateAssetTemplate } = await import("@app/templates/templateCatalog");
    const spellSource = getAssetTemplate("spell-control-foundation")!.initialData as any;
    const spellA = instantiateAssetTemplate<any>("spell-control-foundation", "spell");
    const spellB = instantiateAssetTemplate<any>("spell-control-foundation", "spell");
    spellA.description = "Edited copy";
    spellA.conditionsApplied.push("blinded");
    spellA.components.materialDescription = "a changed component";
    expect(spellB.description).not.toBe("Edited copy");
    expect(spellB.conditionsApplied).toEqual(["restrained"]);
    expect(spellB.components.materialDescription).toBe("");
    expect(spellSource.conditionsApplied).toEqual(["restrained"]);

    const itemSource = getAssetTemplate("magic-item-charged-foundation")!.initialData as any;
    const itemA = instantiateAssetTemplate<any>("magic-item-charged-foundation", "magic-item");
    const itemB = instantiateAssetTemplate<any>("magic-item-charged-foundation", "magic-item");
    itemA.charges.current = 0;
    itemA.damage.diceCount = 9;
    itemA.flavorText = "Edited copy";
    expect(itemB.charges.current).toBe(5);
    expect(itemB.damage.diceCount).toBe(1);
    expect(itemB.flavorText).toBe("");
    expect(itemSource.charges.current).toBe(5);
  });

  it.each(spellCases)("creates, saves, and reopens the %s template through Spell Studio", async (templateId, templateName, assetName) => {
    const user = userEvent.setup();
    const [{ SpellListPage }, { SpellEditPage }] = await Promise.all([
      import("@plugins/spell/pages/SpellListPage"), import("@plugins/spell/pages/SpellEditPage")
    ]);
    render(<MemoryRouter initialEntries={["/spells"]}><Routes>
      <Route path="/spells" element={<SpellListPage />} /><Route path="/spells/:id" element={<SpellEditPage />} />
    </Routes></MemoryRouter>);
    await user.click(await screen.findByRole("button", { name: /create from template/i }));
    const templateLink = screen.getByRole("link", { name: new RegExp(templateName) });
    expect(templateLink).toHaveAttribute("href", `/spells/new?template=${templateId}`);
    await user.click(templateLink);
    await screen.findByDisplayValue(assetName);
    expect(screen.getByRole("heading", { name: "New Spell" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    const savedLink = await screen.findByRole("link", { name: new RegExp(assetName) });
    expect(storedAssets.size).toBe(1);
    const saved = [...storedAssets.values()][0];
    expect(saved.type).toBe("spell");
    const savedData = JSON.parse(saved.data);
    expect(savedData.range).toBeTruthy();
    expect(savedData.duration).toBeTruthy();
    expect(savedData.description).toBeTruthy();
    await user.click(savedLink);
    expect(await screen.findByRole("heading", { name: "Edit Spell" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue(assetName)).toBeInTheDocument());
    expect(storedAssets.size).toBe(1); // Only the instantiated spell is an asset row.
  });

  it.each(itemCases)("creates, saves, and reopens the %s template through Magic Item Studio", async (templateId, templateName, assetName) => {
    const user = userEvent.setup();
    const [{ MagicItemListPage }, { MagicItemEditPage }] = await Promise.all([
      import("@plugins/magic-item/pages/MagicItemListPage"), import("@plugins/magic-item/pages/MagicItemEditPage")
    ]);
    render(<MemoryRouter initialEntries={["/magic-items"]}><Routes>
      <Route path="/magic-items" element={<MagicItemListPage />} /><Route path="/magic-items/:id" element={<MagicItemEditPage />} />
    </Routes></MemoryRouter>);
    await user.click(await screen.findByRole("button", { name: /create from template/i }));
    await user.click(screen.getByRole("link", { name: new RegExp(templateName) }));
    await screen.findByDisplayValue(assetName);
    expect(screen.getByRole("heading", { name: "New Magic Item" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    const savedLink = await screen.findByRole("link", { name: new RegExp(assetName) });
    expect(storedAssets.size).toBe(1);
    const saved = [...storedAssets.values()][0];
    expect(saved.type).toBe("magic-item");
    const savedData = JSON.parse(saved.data);
    expect(savedData.itemType).toBeTruthy();
    expect(savedData.mechanicalText).toBeTruthy();
    if (templateId === "magic-item-charged-foundation") {
      expect(savedData.hasCharges).toBe(true);
      expect(savedData.charges).toMatchObject({ max: 5, current: 5, rechargeTiming: "other" });
    } else {
      expect(savedData.hasCharges).toBe(false);
    }
    expect(savedData.hasDamage).toBe(false);
    await user.click(savedLink);
    expect(await screen.findByRole("heading", { name: "Edit Magic Item" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue(assetName)).toBeInTheDocument());
    expect(storedAssets.size).toBe(1); // Built-ins never become normal assets.
  });

  it("leaves blank creation intact and falls back safely for unknown template IDs", async () => {
    const [{ SpellEditPage }, { MagicItemEditPage }] = await Promise.all([
      import("@plugins/spell/pages/SpellEditPage"), import("@plugins/magic-item/pages/MagicItemEditPage")
    ]);
    const { unmount: unmountSpell } = render(<MemoryRouter initialEntries={["/spells/new"]}><Routes><Route path="/spells/:id" element={<SpellEditPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "New Spell" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Spell name")).toHaveValue("");
    unmountSpell();
    const { unmount: unmountItem } = render(<MemoryRouter initialEntries={["/magic-items/new"]}><Routes><Route path="/magic-items/:id" element={<MagicItemEditPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "New Magic Item" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Item name")).toHaveValue("");
    unmountItem();

    const { unmount: unmountMissingSpell } = render(<MemoryRouter initialEntries={["/spells/new?template=missing-template"]}><Routes><Route path="/spells/:id" element={<SpellEditPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByText(/template could not be used/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Spell name")).toHaveValue("");
    unmountMissingSpell();

    const { registerAssetTemplates } = await import("@app/templates/templateCatalog");
    registerAssetTemplates([{ id: "test-invalid-item-template", name: "Invalid Item", description: "", assetType: "magic-item", category: "test", schemaVersion: 1, initialData: {}, validate: () => false }]);
    const { MagicItemEditPage: InvalidMagicItemEditPage } = await import("@plugins/magic-item/pages/MagicItemEditPage");
    render(<MemoryRouter initialEntries={["/magic-items/new?template=test-invalid-item-template"]}><Routes><Route path="/magic-items/:id" element={<InvalidMagicItemEditPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByText(/template could not be used/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Item name")).toHaveValue("");
    expect(storedAssets.size).toBe(0);
  });
});
