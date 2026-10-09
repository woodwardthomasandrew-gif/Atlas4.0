import { describe, expect, it } from "vitest";
import { estimateCreatureCr } from "@plugins/creature/crEstimator";
import { createDefaultCreatureData, createAbilityEntry } from "@plugins/creature/schema";
import type { CreatureData } from "@plugins/creature/schema";

function creature(overrides: Partial<CreatureData> = {}): CreatureData {
  return { ...createDefaultCreatureData(), ...overrides };
}

function withAttack(dprDice: number, attackBonus: number | null = 4, saveDC: number | null = null): CreatureData {
  const action = createAbilityEntry();
  action.name = "Strike";
  action.damage = { diceCount: dprDice, diceType: "d8", bonus: 0, damageType: "slashing" };
  action.attackBonus = attackBonus;
  action.saveDC = saveDC;
  return creature({ actions: [action] });
}

const rating = (cr: string | null): number => cr === "1/8" ? 0.125 : cr === "1/4" ? 0.25 : cr === "1/2" ? 0.5 : Number(cr);

describe("creature CR estimator", () => {
  it("returns explainable CRs across fractional, low, mid, high, and very high ranges", () => {
    const low = estimateCreatureCr(creature({ hitPoints: 8, armorClass: 11 }));
    const mid = estimateCreatureCr(creature({ hitPoints: 180, armorClass: 17 }));
    const high = estimateCreatureCr(creature({ hitPoints: 500, armorClass: 21 }));
    const veryHigh = estimateCreatureCr(creature({ hitPoints: 1200, armorClass: 27 }));
    expect([low.defensiveCR, mid.defensiveCR, high.defensiveCR, veryHigh.defensiveCR]).toEqual(["0", "9", "28", "30"]);
    expect(estimateCreatureCr(creature({ hitPoints: 25, armorClass: 13 })).defensiveCR).toBe("1/8");
    expect([low.estimatedCR, mid.estimatedCR, high.estimatedCR, veryHigh.estimatedCR]).toEqual(["0", "4", "14", "15"]);
    expect(low.factors.defensive.map((factor) => factor.key)).toContain("hit-points");
    expect(low.factors.offensive.map((factor) => factor.key)).toContain("damage-per-round");
  });

  it("supports offensive-heavy, defensive-heavy, and approximately balanced creatures", () => {
    const defensive = estimateCreatureCr(creature({ hitPoints: 300, armorClass: 20, actions: [withAttack(1).actions[0]] }));
    const offensive = estimateCreatureCr(creature({ hitPoints: 8, armorClass: 10, actions: withAttack(30, 15).actions }));
    const balanced = estimateCreatureCr(creature({ hitPoints: 100, armorClass: 13, actions: withAttack(4, 4).actions }));
    expect(rating(defensive.defensiveCR)).toBeGreaterThan(rating(defensive.offensiveCR));
    expect(rating(offensive.offensiveCR)).toBeGreaterThan(rating(offensive.defensiveCR));
    expect(Math.abs(rating(balanced.defensiveCR) - rating(balanced.offensiveCR))).toBeLessThanOrEqual(2);
  });

  it("adjusts defensive CR for AC and offensive CR for authored attack bonus and save DC", () => {
    const hpData = creature({ hitPoints: 200, armorClass: 12 });
    const lowAc = estimateCreatureCr(hpData);
    const highAc = estimateCreatureCr({ ...hpData, armorClass: 24 });
    expect(rating(highAc.defensiveCR)).toBeGreaterThan(rating(lowAc.defensiveCR));

    const lowAttack = estimateCreatureCr(withAttack(20, 0));
    const highAttack = estimateCreatureCr(withAttack(20, 14));
    expect(rating(highAttack.offensiveCR)).toBeGreaterThan(rating(lowAttack.offensiveCR));
    expect(highAttack.factors.offensive.find((factor) => factor.key === "attack-bonus")?.value).toBe(14);

    const lowDc = estimateCreatureCr(withAttack(20, null, 10));
    const highDc = estimateCreatureCr(withAttack(20, null, 22));
    expect(rating(highDc.offensiveCR)).toBeGreaterThan(rating(lowDc.offensiveCR));
    expect(highDc.factors.offensive.find((factor) => factor.key === "save-dc")?.value).toBe(22);
  });

  it("applies conservative effective HP factors for multiple resistances and immunities", () => {
    const base = creature({ hitPoints: 90, armorClass: 13 });
    const resistance = estimateCreatureCr({ ...base, damageResistances: ["fire", "cold", "lightning"] });
    const immunity = estimateCreatureCr({ ...base, damageImmunities: ["poison", "necrotic"] });
    expect(rating(resistance.defensiveCR)).toBeGreaterThan(rating(estimateCreatureCr(base).defensiveCR));
    expect(rating(immunity.defensiveCR)).toBeGreaterThan(rating(estimateCreatureCr(base).defensiveCR));
    expect(resistance.factors.defensive.find((factor) => factor.key === "damage-defenses")?.explanation).toContain("Applied");
  });

  it("keeps movement and senses contextual and reports prose regeneration as excluded", () => {
    const data = creature({
      speed: { walk: 30, climb: 10, fly: 60, swim: 20, burrow: 5 },
      senses: { passivePerception: { auto: true, value: 10 }, darkvision: { auto: false, value: 120 }, blindsight: { auto: false, value: 30 }, tremorsense: { auto: true, value: 0 }, truesight: { auto: false, value: 60 } },
      traits: [{ ...createAbilityEntry(), name: "Regeneration", description: "The creature regains 10 hit points at the start of its turn." }],
      conditionImmunities: ["frightened"]
    });
    const result = estimateCreatureCr(data);
    expect(result.contextual.movement.fly).toBe(60);
    expect(result.contextual.senses.truesight.value).toBe(60);
    expect(result.contextual.conditionImmunities).toContain("frightened");
    expect(result.excluded.join(" ")).toContain("Regeneration");
  });

  it("handles missing structured offensive statistics with warnings", () => {
    const result = estimateCreatureCr(creature({ actions: [] }));
    expect(result.offensiveCR).toBe("0");
    expect(result.warnings.join(" ")).toContain("No structured action damage");
    expect(result.excluded).toEqual([]);
  });

  it("preserves monotonicity for HP, DPR, attack bonus, and defense removal", () => {
    const baseHp = creature({ hitPoints: 200 });
    expect(rating(estimateCreatureCr({ ...baseHp, hitPoints: 220 }).defensiveCR)).toBeGreaterThanOrEqual(rating(estimateCreatureCr(baseHp).defensiveCR));
    expect(rating(estimateCreatureCr(withAttack(12)).offensiveCR)).toBeLessThanOrEqual(rating(estimateCreatureCr(withAttack(24)).offensiveCR));
    expect(rating(estimateCreatureCr(withAttack(18, 3)).offensiveCR)).toBeLessThanOrEqual(rating(estimateCreatureCr(withAttack(18, 9)).offensiveCR));
    const defenses = creature({ hitPoints: 90, damageResistances: ["fire", "cold", "lightning"] });
    expect(rating(estimateCreatureCr({ ...defenses, damageResistances: [] }).defensiveCR)).toBeLessThanOrEqual(rating(estimateCreatureCr(defenses).defensiveCR));
  });

  it("uses authored action accuracy and does not mutate creature data", () => {
    const data = withAttack(10, 12);
    data.spellcasting = { ...data.spellcasting, enabled: true, attackBonus: 99, saveDC: 21 };
    const before = JSON.stringify(data);
    const result = estimateCreatureCr(data);
    expect(result.factors.offensive.find((factor) => factor.key === "attack-bonus")?.value).toBe(12);
    expect(JSON.stringify(data)).toBe(before);
    expect(result.excluded.join(" ")).toContain("Spellcasting");
  });
});
