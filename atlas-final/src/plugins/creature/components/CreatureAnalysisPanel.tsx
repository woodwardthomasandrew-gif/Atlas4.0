import { calculateCreatureDerivedStats } from "../calculations";
import { estimateCreatureCr, type CrFactor } from "../crEstimator";
import { normalizeCreatureData, type CreatureData } from "../schema";
import "./CreatureAnalysisPanel.css";

export interface CreatureAnalysisPanelProps {
  data: CreatureData;
}

function display(value: number | string | null | undefined, suffix = ""): string {
  return value === null || value === undefined || value === "" ? "—" : `${value}${suffix}`;
}

function authoredModifier(value: number | string | null | undefined): string {
  if (typeof value !== "number") return display(value);
  return `${value >= 0 ? "+" : ""}${value}`;
}

function signed(value: number | undefined, digits = 1): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)} CR`;
}

function findFactor(factors: CrFactor[], key: string): CrFactor | undefined {
  return factors.find((factor) => factor.key === key);
}

function listOrNone(items: readonly string[] | undefined): string {
  return items?.filter(Boolean).join(", ") || "None listed";
}

function senseValue(value: { auto: boolean; value: number } | undefined): string {
  return value && !value.auto && value.value > 0 ? `${value.value} ft.` : "—";
}

function crNumber(value: string | null): number | null {
  if (!value) return null;
  if (value.includes("/")) {
    const [numerator, denominator] = value.split("/").map(Number);
    return denominator ? numerator / denominator : null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function EntryCount({ label, count }: { label: string; count: number }): JSX.Element {
  return (
    <div className="creature-analysis__count">
      <span>{label}</span>
      <strong>{count}</strong>
    </div>
  );
}

function BreakdownFactor({ factor }: { factor: CrFactor }): JSX.Element {
  return (
    <li className="creature-analysis__factor">
      <div>
        <strong>{factor.label}</strong>
        <p>{factor.explanation}</p>
      </div>
      <span>{display(factor.value)}</span>
    </li>
  );
}

/** Read-only, live analysis of the current creature editor state. */
export function CreatureAnalysisPanel({ data }: CreatureAnalysisPanelProps): JSX.Element {
  // Editor records are normalized already, but normalizing here keeps the
  // analysis safe for legacy or partially populated records as well.
  const creature = normalizeCreatureData(data);
  const derived = calculateCreatureDerivedStats(creature);
  const analysis = estimateCreatureCr(creature);
  const damageFactor = findFactor(analysis.factors.offensive, "damage-per-round");
  const dprUnavailable = analysis.warnings.some((warning) => warning.includes("No structured action damage"));
  const effectiveHpFactor = findFactor(analysis.factors.defensive, "effective-hit-points");
  const accuracyFactor = analysis.factors.offensive.find((factor) => factor.key === "attack-bonus" || factor.key === "save-dc");
  const acAdjustment = analysis.adjustments.find((factor) => factor.key === "armor-class")?.effect;
  const effectiveHpAdjustment = analysis.adjustments.find((factor) => factor.key === "resistance-immunity")?.effect;
  const regenerationNotes = creature.traits
    .filter((entry) => /regenerat|regain[s]?.{0,30}hit points|heals?/i.test(entry.description ?? ""))
    .map((entry) => `${entry.name || "Unnamed trait"}: ${entry.description}`);
  const savingThrows = creature.savingThrows.map(({ name, bonus }) => `${name} ${bonus >= 0 ? "+" : ""}${bonus}`);
  const advisory = [...analysis.warnings];
  const defensiveValue = crNumber(analysis.defensiveCR);
  const offensiveValue = crNumber(analysis.offensiveCR);
  if (defensiveValue !== null && offensiveValue !== null && Math.abs(defensiveValue - offensiveValue) >= 4) {
    advisory.push("Defensive and offensive CR differ substantially; consider reviewing how the creature is expected to perform in play.");
  }
  if (accuracyFactor?.effect !== undefined && Math.abs(accuracyFactor.effect) >= 2) {
    advisory.push(`${accuracyFactor.label} is a notable adjustment relative to the CR suggested by damage output.`);
  }

  const contentCounts = [
    ["Traits", creature.traits.length],
    ["Actions", creature.actions.length],
    ["Bonus actions", creature.bonusActions.length],
    ["Reactions", creature.reactions.length],
    ["Legendary actions", creature.legendaryActions.length],
    ["Mythic actions", creature.mythicActions.length],
    ["Lair actions", creature.lairActions.length],
    ["Equipment entries", creature.equipment.length],
    ["Loot entries", creature.lootTable.length]
  ] as const;
  const spellRefCount = creature.spellcasting.spellRefs.length + creature.innateSpellcasting.spellRefs.length;
  const enabledSpellcasting = creature.spellcasting.enabled || creature.innateSpellcasting.enabled;

  return (
    <section className="creature-analysis" aria-label="Creature Analysis">
      <header className="creature-analysis__header">
        <div>
          <p className="creature-analysis__eyebrow">Read-only analysis</p>
          <h3>Creature Analysis</h3>
        </div>
        <span className="creature-analysis__live">Updates as you edit</span>
      </header>

      <section className="creature-analysis__section" aria-labelledby="creature-analysis-summary">
        <h4 id="creature-analysis-summary">Combat Summary</h4>
        <div className="creature-analysis__cr-summary">
          <div className="creature-analysis__estimated">
            <span>Estimated CR</span>
            <strong>{display(analysis.estimatedCR)}</strong>
            <small>Estimated, not authoritative</small>
          </div>
          <div className="creature-analysis__cr-pair">
            <div><span>Defensive CR</span><strong>{display(analysis.defensiveCR)}</strong></div>
            <div><span>Offensive CR</span><strong>{display(analysis.offensiveCR)}</strong></div>
          </div>
        </div>
        <div className="creature-analysis__stats">
          <div><span>CR-derived proficiency bonus <i>Derived</i></span><strong>+{derived.proficiencyBonusFromChallengeRating}</strong></div>
          <div><span>Stored proficiency bonus <i>{creature.proficiencyBonusMode === "manual" ? "Authored" : "Derived"}</i></span><strong>+{creature.proficiencyBonus}</strong></div>
          <div><span>Average DPR <i>Estimated input</i></span><strong>{damageFactor && !dprUnavailable ? display(damageFactor.value) : "Unavailable"}</strong></div>
          <div><span>Effective HP <i>Estimated input</i></span><strong>{effectiveHpFactor ? display(effectiveHpFactor.value) : "Unavailable"}</strong></div>
          <div><span>Armor Class <i>Authored</i></span><strong>{display(creature.armorClass)}</strong></div>
          <div><span>Attack bonus <i>Authored</i></span><strong>{accuracyFactor?.key === "attack-bonus" ? authoredModifier(accuracyFactor.value) : "Unavailable"}</strong></div>
          <div><span>Save DC <i>Authored</i></span><strong>{accuracyFactor?.key === "save-dc" ? display(accuracyFactor.value, "") : "Unavailable"}</strong></div>
          <div><span>Initiative <i>Derived</i></span><strong>{derived.initiative >= 0 ? "+" : ""}{derived.initiative}</strong></div>
          <div><span>Passive Perception <i>Derived</i></span><strong>{derived.passivePerception}</strong></div>
        </div>
        <div className="creature-analysis__ability-modifiers" aria-label="Derived ability modifiers">
          {(Object.keys(derived.abilityModifiers) as Array<keyof typeof derived.abilityModifiers>).map((ability) => (
            <div key={ability}><span>{ability.toUpperCase()}</span><strong>{authoredModifier(derived.abilityModifiers[ability])}</strong></div>
          ))}
        </div>
      </section>

      <details className="creature-analysis__details">
        <summary>CR Breakdown</summary>
        <div className="creature-analysis__breakdown">
          <section>
            <h5>Defensive</h5>
            <p className="creature-analysis__base">Base defensive CR: <strong>{display(analysis.baseDefensiveCR)}</strong></p>
            <ul>
              {analysis.factors.defensive.map((factor) => <BreakdownFactor key={factor.key} factor={factor} />)}
            </ul>
            <p className="creature-analysis__adjustment">AC adjustment: {signed(acAdjustment)}</p>
            {effectiveHpAdjustment !== undefined && <p className="creature-analysis__adjustment">Effective HP adjustment: {signed(effectiveHpAdjustment)}</p>}
            <p className="creature-analysis__result">Final defensive CR <strong>{display(analysis.defensiveCR)}</strong></p>
          </section>
          <section>
            <h5>Offensive</h5>
            <p className="creature-analysis__base">Base offensive CR: <strong>{display(analysis.baseOffensiveCR)}</strong></p>
            <ul>
              {analysis.factors.offensive.map((factor) => <BreakdownFactor key={factor.key} factor={factor} />)}
            </ul>
            <p className="creature-analysis__adjustment">{accuracyFactor?.label ?? "Accuracy"} adjustment: {signed(accuracyFactor?.effect)}</p>
            <p className="creature-analysis__result">Final offensive CR <strong>{display(analysis.offensiveCR)}</strong></p>
          </section>
          <p className="creature-analysis__final">Final estimated CR <strong>{display(analysis.estimatedCR)}</strong></p>
        </div>
      </details>

      <details className="creature-analysis__details">
        <summary>Assumptions &amp; Limitations</summary>
        <ul className="creature-analysis__notes">
          <li>Uses the 2014 DMG defensive/offensive CR approach with interpolation between CR anchors.</li>
          <li>Offensive CR uses the highest-damage structured ordinary Action entry; it does not simulate the full action economy.</li>
          <li>Prose abilities and regeneration are not automatically evaluated.</li>
          <li>Spellcasting cadence and damage from bonus actions, reactions, legendary actions, and mythic actions are not included in DPR.</li>
          <li>Movement and senses are contextual and do not modify numerical CR.</li>
          <li>This estimate is a design aid; the DM decides whether the creature suits the game.</li>
          {analysis.excluded.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>

      <section className="creature-analysis__section" aria-labelledby="creature-analysis-defenses">
        <h4 id="creature-analysis-defenses">Defenses</h4>
        <div className="creature-analysis__context-row"><span>Damage resistances <i>CR input when threshold met</i></span><strong>{listOrNone(creature.damageResistances)}</strong></div>
        <div className="creature-analysis__context-row"><span>Damage immunities <i>CR input when threshold met</i></span><strong>{listOrNone(creature.damageImmunities)}</strong></div>
        <div className="creature-analysis__context-row"><span>Damage vulnerabilities <i>Context only</i></span><strong>{listOrNone(creature.damageVulnerabilities)}</strong></div>
        <div className="creature-analysis__context-row"><span>Condition immunities <i>Context only</i></span><strong>{listOrNone(creature.conditionImmunities)}</strong></div>
        <div className="creature-analysis__context-row"><span>Saving throws <i>Authored · context only</i></span><strong>{listOrNone(savingThrows)}</strong></div>
        <div className="creature-analysis__context-row"><span>Recovery / regeneration <i>Prose · not included in CR</i></span><strong>{listOrNone(regenerationNotes)}</strong></div>
      </section>

      <section className="creature-analysis__section" aria-labelledby="creature-analysis-mobility">
        <h4 id="creature-analysis-mobility">Mobility &amp; Senses <span>Context only</span></h4>
        <div className="creature-analysis__mobility">
          {(["walk", "fly", "swim", "climb", "burrow"] as const).map((mode) => (
            <div key={mode}><span>{mode}</span><strong>{display(creature.speed[mode], " ft.")}</strong></div>
          ))}
        </div>
        <div className="creature-analysis__mobility">
          <div><span>Darkvision</span><strong>{senseValue(creature.senses.darkvision)}</strong></div>
          <div><span>Blindsight</span><strong>{senseValue(creature.senses.blindsight)}</strong></div>
          <div><span>Tremorsense</span><strong>{senseValue(creature.senses.tremorsense)}</strong></div>
          <div><span>Truesight</span><strong>{senseValue(creature.senses.truesight)}</strong></div>
        </div>
      </section>

      <section className="creature-analysis__section" aria-labelledby="creature-analysis-content">
        <h4 id="creature-analysis-content">Creature Content</h4>
        <div className="creature-analysis__counts">
          {contentCounts.map(([label, count]) => <EntryCount key={label} label={label} count={count} />)}
          <EntryCount label="Spell references" count={spellRefCount} />
          <EntryCount label="Spellcasting blocks enabled" count={Number(creature.spellcasting.enabled) + Number(creature.innateSpellcasting.enabled)} />
          <EntryCount label="Artwork" count={creature.artworkDataUrl ? 1 : 0} />
        </div>
        {enabledSpellcasting && spellRefCount === 0 && <p className="creature-analysis__muted">Spellcasting is enabled; cadence and freeform notes are not quantified here.</p>}
        <p className="creature-analysis__muted">Counts summarize saved creature entries. The data model does not record whether an entry originated from a reusable library component.</p>
      </section>

      {advisory.length > 0 && (
        <aside className="creature-analysis__advisory" aria-label="Analysis notices">
          <strong>Analysis notices</strong>
          <ul>{advisory.map((notice) => <li key={notice}>{notice}</li>)}</ul>
        </aside>
      )}

    </section>
  );
}
