import { describe, expect, it } from "vitest";
import { calculateCreatureDerivedStats, calculateInitiative, calculatePassivePerception, averageDamage } from "@plugins/creature/calculations";
import { createDefaultCreatureData } from "@plugins/creature/schema";

describe("creature derived calculations", () => {
  it("calculates ability modifiers, CR proficiency, initiative, and passive perception", () => {
    const data = createDefaultCreatureData();
    data.challengeRating = "5";
    data.abilities = { str: 8, dex: 16, con: 14, int: 12, wis: 18, cha: 10 };

    expect(calculateCreatureDerivedStats(data)).toEqual({
      abilityModifiers: { str: -1, dex: 3, con: 2, int: 1, wis: 4, cha: 0 },
      proficiencyBonusFromChallengeRating: 3,
      initiative: 3,
      passivePerception: 14
    });
  });

  it("uses an authored Perception bonus and respects a manual passive value", () => {
    expect(calculatePassivePerception(18, [{ name: "Perception", bonus: 7 }])).toBe(17);
    expect(calculatePassivePerception(18, [{ name: "Perception", bonus: 7 }], 12)).toBe(12);
  });

  it("calculates initiative and structured damage averages", () => {
    expect(calculateInitiative(7)).toBe(-2);
    expect(averageDamage({ diceCount: 2, diceType: "d8", bonus: 3, damageType: "force" })).toBe(12);
  });
});
