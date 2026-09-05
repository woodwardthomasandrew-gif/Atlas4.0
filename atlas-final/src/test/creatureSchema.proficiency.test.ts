import { describe, expect, it } from "vitest";
import {
  createDefaultCreatureData,
  normalizeCreatureData,
  proficiencyBonusForChallengeRating
} from "@plugins/creature/schema";

describe("creature proficiency bonus synchronization", () => {
  it("maps standard challenge ratings to 5e proficiency bonuses", () => {
    expect(proficiencyBonusForChallengeRating("0")).toBe(2);
    expect(proficiencyBonusForChallengeRating("1/2")).toBe(2);
    expect(proficiencyBonusForChallengeRating("5")).toBe(3);
    expect(proficiencyBonusForChallengeRating("13")).toBe(5);
    expect(proficiencyBonusForChallengeRating("30")).toBe(9);
  });

  it("defaults new creatures to a CR-derived proficiency bonus", () => {
    const data = createDefaultCreatureData();
    expect(data.proficiencyBonus).toBe(2);
    expect(data.proficiencyBonusMode).toBe("auto");
  });

  it("backfills old records without changing their other values", () => {
    const data = normalizeCreatureData({ challengeRating: "15", hitPoints: 42 });
    expect(data.proficiencyBonus).toBe(5);
    expect(data.proficiencyBonusMode).toBe("auto");
    expect(data.hitPoints).toBe(42);
  });

  it("preserves a pre-existing proficiency value when no mode is stored", () => {
    const data = normalizeCreatureData({ challengeRating: "15", proficiencyBonus: 11 });
    expect(data.proficiencyBonus).toBe(11);
    expect(data.proficiencyBonusMode).toBe("manual");
  });
});
