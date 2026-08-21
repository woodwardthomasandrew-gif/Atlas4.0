import { describe, expect, it } from "vitest";
import { formatEquipmentEntry, groupSpellsByLevel, spellLevelLabel } from "@plugins/creature/cardText";
import { normalizeCreatureData, createDefaultCreatureData } from "@plugins/creature/schema";

describe("equipment formatting", () => {
  it("formats name, quantity, and notes", () => {
    expect(formatEquipmentEntry({ name: "Longsword", quantity: "1", notes: "masterwork" })).toBe(
      "Longsword (1) - masterwork"
    );
  });

  it("omits empty quantity/notes cleanly", () => {
    expect(formatEquipmentEntry({ name: "Rope", quantity: "", notes: "" })).toBe("Rope");
  });
});

describe("spell grouping", () => {
  it("groups cantrips first, then ascending level, alphabetical within a level", () => {
    const refs = [
      { name: "Fireball", level: 3 },
      { name: "Mage Hand", level: 0 },
      { name: "Counterspell", level: 3 },
      { name: "Fire Bolt", level: 0 },
      { name: "Shield", level: 1 }
    ];
    const groups = groupSpellsByLevel(refs);
    expect(groups.map((g) => g.label)).toEqual(["Cantrips", "1st Level", "3rd Level"]);
    expect(groups[0].names).toEqual(["Fire Bolt", "Mage Hand"]);
    expect(groups[2].names).toEqual(["Counterspell", "Fireball"]);
  });

  it("returns an empty array for no spells", () => {
    expect(groupSpellsByLevel([])).toEqual([]);
  });

  it("labels levels correctly, including ordinals beyond 5", () => {
    expect(spellLevelLabel(0)).toBe("Cantrips");
    expect(spellLevelLabel(1)).toBe("1st Level");
    expect(spellLevelLabel(2)).toBe("2nd Level");
    expect(spellLevelLabel(9)).toBe("9th Level");
  });
});

describe("creature data normalization for spells", () => {
  it("defaults spellRefs missing a level to 0 rather than throwing", () => {
    const data = normalizeCreatureData({
      ...createDefaultCreatureData(),
      spellcasting: {
        enabled: true,
        ability: "int",
        saveDC: 10,
        attackBonus: 0,
        // Simulates legacy data saved before `level` existed on SpellReference.
        spellRefs: [{ assetId: "a1", name: "Legacy Spell" }],
        freeformNotes: ""
      }
    });
    expect(data.spellcasting.spellRefs[0].level).toBe(0);
  });
});
