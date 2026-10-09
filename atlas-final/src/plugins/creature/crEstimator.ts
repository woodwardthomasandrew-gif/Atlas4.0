import { averageDamage } from "./calculations";
import type { CreatureAbilityEntry, CreatureData } from "./schema";

export interface CrFactor {
  key: string;
  label: string;
  value: number | string | null;
  explanation: string;
  effect?: number;
}

export interface CreatureCrAnalysis {
  estimatedCR: string | null;
  defensiveCR: string | null;
  offensiveCR: string | null;
  /** HP-derived CR after effective-HP adjustments, before AC adjustment. */
  baseDefensiveCR: string | null;
  /** DPR-derived CR before attack bonus or save DC adjustment. */
  baseOffensiveCR: string | null;
  factors: { defensive: CrFactor[]; offensive: CrFactor[] };
  adjustments: CrFactor[];
  contextual: {
    movement: CreatureData["speed"];
    senses: CreatureData["senses"];
    conditionImmunities: string[];
    vulnerabilities: string[];
  };
  excluded: string[];
  warnings: string[];
}

/** 2014 DMG table anchors. Between anchors ratings are interpolated to avoid
 * large jumps from small numeric changes; the reported CR is the nearest
 * supported standard CR (including fractional ratings). */
const CR_VALUES = [0, 0.125, 0.25, 0.5, ...Array.from({ length: 30 }, (_, i) => i + 1)];
const CR_LABELS = ["0", "1/8", "1/4", "1/2", ...Array.from({ length: 30 }, (_, i) => String(i + 1))];
const HP_ANCHORS = [3, 21, 42, 60, 78, 93, 108, 123, 138, 153, 168, 183, 198, 213, 228, 243, 258, 273, 288, 303, 318, 333, 348, 363, 378, 393, 408, 423, 438, 453, 483, 528, 603, 675];
const DPR_ANCHORS = [1, 3, 5, 7, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300];
const AC_ANCHORS = [13, 13, 13, 13, 13, 13, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19];
const ACCURACY_ANCHORS = [3, 3, 3, 3, 3, 3, 3, 4, 5, 6, 6, 7, 8, 8, 9, 9, 10, 10, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17];

function interpolateRating(value: number, anchors: number[]): number {
  if (value <= anchors[0]) return CR_VALUES[0];
  for (let i = 1; i < anchors.length; i += 1) {
    if (value <= anchors[i]) {
      const span = anchors[i] - anchors[i - 1] || 1;
      const ratio = (value - anchors[i - 1]) / span;
      return CR_VALUES[i - 1] + ratio * (CR_VALUES[i] - CR_VALUES[i - 1]);
    }
  }
  const last = anchors.length - 1;
  const step = CR_VALUES[last] - CR_VALUES[last - 1];
  const valueStep = anchors[last] - anchors[last - 1] || 1;
  return Math.min(30, CR_VALUES[last] + ((value - anchors[last]) / valueStep) * step);
}

function nearestCr(rating: number): string {
  let best = 0;
  for (let i = 1; i < CR_VALUES.length; i += 1) {
    if (Math.abs(CR_VALUES[i] - rating) < Math.abs(CR_VALUES[best] - rating)) best = i;
  }
  return CR_LABELS[best];
}

function expectedAtRating(rating: number, anchors: number[]): number {
  if (rating <= CR_VALUES[0]) return anchors[0];
  for (let i = 1; i < CR_VALUES.length; i += 1) {
    if (rating <= CR_VALUES[i]) {
      const ratio = (rating - CR_VALUES[i - 1]) / (CR_VALUES[i] - CR_VALUES[i - 1]);
      return anchors[i - 1] + ratio * (anchors[i] - anchors[i - 1]);
    }
  }
  return anchors[anchors.length - 1];
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function usableEntries(entries: readonly CreatureAbilityEntry[] | undefined): CreatureAbilityEntry[] {
  return (entries ?? []).filter((entry) => entry?.damage && Number.isFinite(entry.damage.diceCount) && Number.isFinite(entry.damage.bonus));
}

function selectStructuredDamage(entries: readonly CreatureAbilityEntry[]): { entry: CreatureAbilityEntry | null; dpr: number } {
  let best: CreatureAbilityEntry | null = null;
  let dpr = 0;
  for (const entry of entries) {
    if (!entry.damage) continue;
    const attacks = 1 + Math.max(0, numberOrZero(entry.extraAttacksCount));
    const candidate = Math.max(0, averageDamage(entry.damage)) * attacks;
    if (candidate > dpr || best === null) {
      best = entry;
      dpr = candidate;
    }
  }
  return { entry: best, dpr };
}

/**
 * Estimates CR from authored creature statistics without mutating them.
 * It follows the 2014 DMG defensive/offensive split, interpolating between
 * table anchors to make incremental edits produce gradual changes.
 */
export function estimateCreatureCr(data: CreatureData): CreatureCrAnalysis {
  const warnings: string[] = [];
  const excluded: string[] = [];
  const adjustments: CrFactor[] = [];
  const hp = Math.max(0, numberOrZero(data?.hitPoints));
  const ac = Math.max(0, numberOrZero(data?.armorClass));
  const resistanceCount = Array.isArray(data?.damageResistances) ? data.damageResistances.filter(Boolean).length : 0;
  const immunityCount = Array.isArray(data?.damageImmunities) ? data.damageImmunities.filter(Boolean).length : 0;
  const rawDefensive = interpolateRating(hp, HP_ANCHORS);
  // DMG effective-HP guidance: only several resistances/immunities merit a
  // multiplier. This is deliberately conservative for parties and damage
  // types that the schema cannot describe.
  let durabilityMultiplier = 1;
  if (immunityCount >= 2 || resistanceCount >= 3) {
    durabilityMultiplier = rawDefensive <= 4 ? 2 : rawDefensive <= 10 ? 1.5 : rawDefensive <= 16 ? 1.25 : 1.1;
  }
  const effectiveHp = hp * durabilityMultiplier;
  const hpRating = interpolateRating(effectiveHp, HP_ANCHORS);
  const acAdjustment = ac > 0 ? (ac - expectedAtRating(hpRating, AC_ANCHORS)) / 2 : 0;
  const defensiveRating = Math.max(0, Math.min(30, hpRating + acAdjustment));
  adjustments.push({ key: "effective-hit-points", label: "Effective hit points", value: effectiveHp, explanation: `Base HP ${hp} × ${durabilityMultiplier} from ${resistanceCount} resistance(s) and ${immunityCount} immunity/immunities.`, effect: defensiveRating - rawDefensive });
  if (ac > 0) adjustments.push({ key: "armor-class", label: "Armor Class", value: ac, explanation: `Compared with the expected AC at the HP-derived rating; each 2-point difference adjusts defensive CR by about 1.`, effect: acAdjustment });
  if (durabilityMultiplier > 1) adjustments.push({ key: "resistance-immunity", label: "Resistance/immunity durability", value: durabilityMultiplier, explanation: "DMG-style effective-HP factor for multiple damage-type defenses.", effect: hpRating - rawDefensive });

  // The ordinary Actions list has the most stable turn cadence. Other
  // categories can be conditional or limited and cannot be reliably folded
  // into per-round damage with fields the schema currently provides.
  const actionDamageEntries = usableEntries(data?.actions);
  const selected = selectStructuredDamage(actionDamageEntries);
  const dprRating = interpolateRating(selected.dpr, DPR_ANCHORS);
  const selectedEntry = selected.entry;
  const authoredAccuracy = selectedEntry?.saveDC !== null && selectedEntry?.saveDC !== undefined
    ? numberOrZero(selectedEntry.saveDC)
    : selectedEntry?.attackBonus !== null && selectedEntry?.attackBonus !== undefined
      ? numberOrZero(selectedEntry.attackBonus)
      : null;
  const expectedAccuracy = expectedAtRating(dprRating, selectedEntry?.saveDC != null ? ACCURACY_ANCHORS.map((value) => value + 8) : ACCURACY_ANCHORS);
  const accuracyAdjustment = authoredAccuracy === null ? 0 : (authoredAccuracy - expectedAccuracy) / 2;
  const offensiveRating = Math.max(0, Math.min(30, dprRating + accuracyAdjustment));

  if (!Number.isFinite(data?.hitPoints) || hp <= 0) warnings.push("Hit points are missing or nonpositive; defensive CR is based on zero HP.");
  if (!Number.isFinite(data?.armorClass) || ac <= 0) warnings.push("Armor Class is missing or nonpositive; no AC adjustment was applied.");
  if (!selectedEntry) warnings.push("No structured action damage was available; offensive CR uses zero DPR.");
  if (selectedEntry && authoredAccuracy === null) warnings.push(`“${selectedEntry.name || "Unnamed action"}” has structured damage but no authored attack bonus or save DC; no accuracy adjustment was applied.`);

  const defensiveFactors: CrFactor[] = [
    { key: "hit-points", label: "Base hit points", value: hp, explanation: `Maps to an HP-derived defensive rating of ${nearestCr(rawDefensive)}.` },
    { key: "effective-hit-points", label: "Effective hit points", value: effectiveHp, explanation: `Maps to ${nearestCr(hpRating)} before AC adjustment.` },
    { key: "armor-class", label: "Armor Class", value: ac || null, explanation: `Expected AC near this HP rating: ${Math.round(expectedAtRating(hpRating, AC_ANCHORS))}.`, effect: acAdjustment }
  ];
  if (resistanceCount || immunityCount) defensiveFactors.push({ key: "damage-defenses", label: "Damage resistances and immunities", value: `${resistanceCount} resistance(s), ${immunityCount} immunity/immunities`, explanation: durabilityMultiplier > 1 ? `Applied ${durabilityMultiplier}× effective HP.` : "Not enough listed types to apply the DMG multiple-defense guidance." });
  const offensiveFactors: CrFactor[] = [
    { key: "damage-per-round", label: "Structured damage per round", value: selected.dpr, explanation: selectedEntry ? `Uses the highest single structured damage entry (“${selectedEntry.name || "Unnamed action"}”) as one action's round output; extra attacks are included.` : "No structured action damage was available.", effect: dprRating },
    { key: selectedEntry?.saveDC != null ? "save-dc" : "attack-bonus", label: selectedEntry?.saveDC != null ? "Authored save DC" : "Authored attack bonus", value: authoredAccuracy, explanation: authoredAccuracy === null ? "No authored accuracy value; omitted." : `Compared with ${Math.round(expectedAccuracy)} expected at this DPR rating; each 2-point difference adjusts offensive CR by about 1.`, effect: accuracyAdjustment }
  ];

  const proseAbilities = ["traits", "actions", "bonusActions", "reactions", "legendaryActions", "lairActions", "mythicActions"] as const;
  if (proseAbilities.some((key) => (data?.[key] ?? []).some((entry) => entry.description?.trim()))) excluded.push("Prose-described traits and abilities (including legendary/lair/mythic abilities) are not interpreted; only structured damage and accuracy on a selected entry are used.");
  if (data?.spellcasting?.enabled || data?.innateSpellcasting?.enabled) excluded.push("Spellcasting and innate spellcasting are excluded because spellRefs/freeform notes do not encode a reliable per-round use pattern.");
  if (data?.savingThrows?.length) excluded.push("Authored saving throw bonuses are preserved as creature data but do not directly change the HP/AC defensive CR calculation; the model does not encode how often those saves negate damage or conditions.");
  if ((data?.traits ?? []).some((entry) => /regenerat|regain[s]?.{0,30}hit points|heals?/i.test(entry.description ?? ""))) excluded.push("Regeneration or recurring healing is described in prose and is not converted to effective HP.");
  if ((data?.legendaryActions ?? []).length || (data?.mythicActions ?? []).length) excluded.push("Legendary and mythic action cadence and effects are not modeled.");
  if (actionDamageEntries.length > 1) excluded.push("The schema does not indicate action frequency, alternative action groups, or targets; the highest single structured action damage entry is used instead of summing actions.");
  if ([...(data?.bonusActions ?? []), ...(data?.reactions ?? []), ...(data?.legendaryActions ?? []), ...(data?.mythicActions ?? [])].some((entry) => entry.damage)) excluded.push("Structured damage in bonus actions, reactions, legendary actions, and mythic actions is excluded because its per-round cadence is not encoded.");
  if (data?.damageVulnerabilities?.length) excluded.push("Damage vulnerabilities are retained as context but do not alter effective HP because the model cannot determine likely incoming damage types.");

  return {
    estimatedCR: nearestCr((defensiveRating + offensiveRating) / 2),
    defensiveCR: nearestCr(defensiveRating),
    offensiveCR: nearestCr(offensiveRating),
    baseDefensiveCR: nearestCr(hpRating),
    baseOffensiveCR: nearestCr(dprRating),
    factors: { defensive: defensiveFactors, offensive: offensiveFactors },
    adjustments,
    contextual: {
      movement: data?.speed ?? { walk: 0, climb: 0, fly: 0, swim: 0, burrow: 0 },
      senses: data?.senses ?? { passivePerception: { auto: true, value: 0 }, darkvision: { auto: true, value: 0 }, blindsight: { auto: true, value: 0 }, tremorsense: { auto: true, value: 0 }, truesight: { auto: true, value: 0 } },
      conditionImmunities: data?.conditionImmunities ?? [],
      vulnerabilities: data?.damageVulnerabilities ?? []
    },
    excluded: [...new Set(excluded)],
    warnings
  };
}
