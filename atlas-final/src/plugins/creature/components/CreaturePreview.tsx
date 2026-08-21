import type { AssetPreviewProps } from "@app/plugin-api/types";
import type { CreatureData } from "../schema";
import {
  formatAbilityEntry,
  formatAbilityLine,
  formatCrLine,
  formatEquipmentEntry,
  formatLootTableEntry,
  formatSpellcastingBody,
  formatSensesLine,
  formatSpeedLine,
  sizeLabel
} from "../cardText";
import "./CreaturePreview.css";

function renderTextSection(title: string, lines: string[]): JSX.Element | null {
  if (lines.length === 0) return null;
  return (
    <section className="creature-card__section">
      <h3 className="creature-card__section-title">{title}</h3>
      {lines.map((line, index) => (
        <p key={`${title}-${index}`} className="creature-card__entry">
          {line}
        </p>
      ))}
    </section>
  );
}

export function CreaturePreview({ name, data }: AssetPreviewProps<CreatureData>): JSX.Element {
  const spellcastingLines = formatSpellcastingBody(data.spellcasting);
  const innateSpellcastingLines = formatSpellcastingBody(data.innateSpellcasting);
  return (
    <div className="creature-card">
      {data.artworkDataUrl && (
        <img className="creature-card__artwork" src={data.artworkDataUrl} alt={name} />
      )}

      <header className="creature-card__header">
        <h2 className="creature-card__name">{name || "Unnamed Creature"}</h2>
        <p className="creature-card__subtitle">
          {sizeLabel(data.size)} {data.creatureType || "creature"}, {data.alignment}
        </p>
      </header>

      <div className="creature-card__divider" />

      <p>
        <strong>Armor Class</strong> {data.armorClass} {data.armorClassNote}
      </p>
      <p>
        <strong>Hit Points</strong> {data.hitPoints} {data.hitDice && `(${data.hitDice})`}
      </p>
      <p>
        <strong>Speed</strong> {formatSpeedLine(data)}
      </p>

      <div className="creature-card__divider" />

      <p className="creature-card__abilities">{formatAbilityLine(data)}</p>

      <div className="creature-card__divider" />

      {data.savingThrows.length > 0 && (
        <p>
          <strong>Saving Throws</strong>{" "}
          {data.savingThrows.map((s) => `${s.name} ${s.bonus >= 0 ? "+" : ""}${s.bonus}`).join(", ")}
        </p>
      )}
      {data.skills.length > 0 && (
        <p>
          <strong>Skills</strong>{" "}
          {data.skills.map((s) => `${s.name} ${s.bonus >= 0 ? "+" : ""}${s.bonus}`).join(", ")}
        </p>
      )}
      {data.damageVulnerabilities.length > 0 && (
        <p>
          <strong>Damage Vulnerabilities</strong> {data.damageVulnerabilities.join(", ")}
        </p>
      )}
      {data.damageResistances.length > 0 && (
        <p>
          <strong>Damage Resistances</strong> {data.damageResistances.join(", ")}
        </p>
      )}
      {data.damageImmunities.length > 0 && (
        <p>
          <strong>Damage Immunities</strong> {data.damageImmunities.join(", ")}
        </p>
      )}
      {data.conditionImmunities.length > 0 && (
        <p>
          <strong>Condition Immunities</strong> {data.conditionImmunities.join(", ")}
        </p>
      )}
      <p>
        <strong>Senses</strong> {formatSensesLine(data)}
      </p>
      {data.languages && (
        <p>
          <strong>Languages</strong> {data.languages}
        </p>
      )}
      <p>
        <strong>Challenge</strong> {formatCrLine(data)}
      </p>

      <div className="creature-card__divider" />

      {data.traits.map((trait) => (
        <p key={trait.id} className="creature-card__entry">
          <em>{formatAbilityEntry(trait)}</em>
        </p>
      ))}

      {data.actions.length > 0 && (
        <>
          <h3 className="creature-card__section-title">Actions</h3>
          {data.actions.map((action) => (
            <p key={action.id} className="creature-card__entry">
              {formatAbilityEntry(action)}
            </p>
          ))}
        </>
      )}

      {data.bonusActions.length > 0 && (
        <>
          <h3 className="creature-card__section-title">Bonus Actions</h3>
          {data.bonusActions.map((entry) => (
            <p key={entry.id} className="creature-card__entry">
              {formatAbilityEntry(entry)}
            </p>
          ))}
        </>
      )}

      {data.reactions.length > 0 && (
        <>
          <h3 className="creature-card__section-title">Reactions</h3>
          {data.reactions.map((entry) => (
            <p key={entry.id} className="creature-card__entry">
              {formatAbilityEntry(entry)}
            </p>
          ))}
        </>
      )}

      {data.legendaryActions.length > 0 && (
        <>
          <h3 className="creature-card__section-title">Legendary Actions</h3>
          {data.legendaryActions.map((entry) => (
            <p key={entry.id} className="creature-card__entry">
              {formatAbilityEntry(entry)}
            </p>
          ))}
        </>
      )}

      {spellcastingLines.length > 0 && renderTextSection("Spellcasting", spellcastingLines)}
      {innateSpellcastingLines.length > 0 &&
        renderTextSection("Innate Spellcasting", innateSpellcastingLines)}
      {renderTextSection("Regional Effects", data.regionalEffects.map((effect) => `- ${effect}`))}
      {data.equipment.length > 0 &&
        renderTextSection("Equipment", data.equipment.map((entry) => formatEquipmentEntry(entry)))}
      {data.lootTable.length > 0 &&
        renderTextSection("Loot Table", data.lootTable.map((entry) => formatLootTableEntry(entry)))}
      {data.notes.trim().length > 0 && renderTextSection("Notes", [data.notes.trim()])}
      {data.tags.length > 0 && renderTextSection("Tags", [data.tags.join(", ")])}
    </div>
  );
}
