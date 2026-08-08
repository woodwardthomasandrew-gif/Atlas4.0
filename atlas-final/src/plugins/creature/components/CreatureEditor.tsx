import type { AssetEditorProps } from "@app/plugin-api/types";
import { Input } from "@ui/components";
import { CollapsibleSection } from "@plugins/shared/components/CollapsibleSection";
import { TagSelect } from "@plugins/shared/components/TagSelect";
import { ChipInput } from "@plugins/shared/components/ChipInput";
import { ArtworkField } from "@plugins/shared/components/ArtworkField";
import { COMMON_CONDITIONS, COMMON_DAMAGE_TAGS } from "@plugins/shared/presets";
import {
  CHALLENGE_RATINGS,
  COMMON_ALIGNMENTS,
  COMMON_CREATURE_TYPE_TAGS,
  CREATURE_SIZES,
  resolveExperience,
  resolvePassivePerception,
  type CreatureData,
  type CreatureSize,
  type SenseValue
} from "../schema";
import { AbilityScoreGrid } from "./AbilityScoreGrid";
import { NamedBonusList } from "./NamedBonusList";
import { SenseRow } from "./SenseRow";
import { AbilityEntryList } from "./AbilityEntryList";
import { SpellcastingFields } from "./SpellcastingFields";
import { InventoryList } from "./InventoryList";
import { LootTableList } from "./LootTableList";
import "./CreatureEditor.css";

export function CreatureEditor({ data, onChange }: AssetEditorProps<CreatureData>): JSX.Element {
  const update = <K extends keyof CreatureData>(key: K, value: CreatureData[K]): void => {
    onChange({ ...data, [key]: value });
  };

  const updateSense = (key: keyof CreatureData["senses"], value: SenseValue): void => {
    onChange({ ...data, senses: { ...data.senses, [key]: value } });
  };

  return (
    <div className="creature-editor">
      {/* Basic Information */}
      <section className="creature-editor__section">
        <h2>Basic Information</h2>
        <div className="creature-editor__row">
          <label className="creature-editor__field">
            <span>Size</span>
            <select
              value={data.size}
              onChange={(e) => update("size", e.target.value as CreatureSize)}
            >
              {CREATURE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <label className="creature-editor__field">
            <span>Creature Type</span>
            <Input
              list="creature-type-suggestions"
              value={data.creatureType}
              onChange={(e) => update("creatureType", e.target.value)}
              placeholder="beast, humanoid, undead..."
            />
            <datalist id="creature-type-suggestions">
              {COMMON_CREATURE_TYPE_TAGS.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </label>

          <label className="creature-editor__field">
            <span>Alignment</span>
            <Input
              list="alignment-suggestions"
              value={data.alignment}
              onChange={(e) => update("alignment", e.target.value)}
            />
            <datalist id="alignment-suggestions">
              {COMMON_ALIGNMENTS.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="creature-editor__row">
          <label className="creature-editor__field">
            <span>Challenge Rating</span>
            <select
              value={data.challengeRating}
              onChange={(e) => update("challengeRating", e.target.value)}
            >
              {CHALLENGE_RATINGS.map((cr) => (
                <option key={cr} value={cr}>
                  {cr}
                </option>
              ))}
            </select>
          </label>

          <label className="creature-editor__field">
            <span>Experience</span>
            <div className="creature-editor__xp-row">
              <select
                value={data.experienceMode}
                onChange={(e) =>
                  update("experienceMode", e.target.value as CreatureData["experienceMode"])
                }
              >
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
              {data.experienceMode === "manual" ? (
                <Input
                  type="number"
                  value={data.experienceManualValue}
                  onChange={(e) => update("experienceManualValue", Number(e.target.value))}
                />
              ) : (
                <span className="creature-editor__calculated">{resolveExperience(data)} XP</span>
              )}
            </div>
          </label>
        </div>
      </section>

      {/* Defences */}
      <section className="creature-editor__section">
        <h2>Defences</h2>
        <div className="creature-editor__row">
          <label className="creature-editor__field">
            <span>Armor Class</span>
            <Input
              type="number"
              value={data.armorClass}
              onChange={(e) => update("armorClass", Number(e.target.value))}
            />
          </label>
          <label className="creature-editor__field">
            <span>AC Note</span>
            <Input
              placeholder="(natural armor)"
              value={data.armorClassNote}
              onChange={(e) => update("armorClassNote", e.target.value)}
            />
          </label>
          <label className="creature-editor__field">
            <span>Hit Points</span>
            <Input
              type="number"
              value={data.hitPoints}
              onChange={(e) => update("hitPoints", Number(e.target.value))}
            />
          </label>
          <label className="creature-editor__field">
            <span>Hit Dice</span>
            <Input
              placeholder="8d8 + 16"
              value={data.hitDice}
              onChange={(e) => update("hitDice", e.target.value)}
            />
          </label>
        </div>

        <div className="creature-editor__field">
          <span>Speed (ft.)</span>
          <div className="creature-editor__speed-row">
            {(["walk", "climb", "fly", "swim", "burrow"] as const).map((mode) => (
              <label key={mode} className="creature-editor__speed-field">
                <span>{mode}</span>
                <Input
                  type="number"
                  step={5}
                  min={0}
                  value={data.speed[mode]}
                  onChange={(e) =>
                    update("speed", { ...data.speed, [mode]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Ability Scores */}
      <section className="creature-editor__section">
        <h2>Ability Scores</h2>
        <AbilityScoreGrid value={data.abilities} onChange={(v) => update("abilities", v)} />
      </section>

      {/* Saving Throws & Skills */}
      <section className="creature-editor__section">
        <h2>Saving Throws</h2>
        <NamedBonusList
          value={data.savingThrows}
          onChange={(v) => update("savingThrows", v)}
          namePlaceholder="Saving Throw"
        />
      </section>

      <section className="creature-editor__section">
        <h2>Skills</h2>
        <NamedBonusList value={data.skills} onChange={(v) => update("skills", v)} namePlaceholder="Skill" />
      </section>

      {/* Damage & Conditions */}
      <section className="creature-editor__section">
        <h2>Damage Vulnerabilities</h2>
        <TagSelect
          value={data.damageVulnerabilities}
          onChange={(v) => update("damageVulnerabilities", v)}
          presets={COMMON_DAMAGE_TAGS}
        />
      </section>

      <section className="creature-editor__section">
        <h2>Damage Resistances</h2>
        <TagSelect
          value={data.damageResistances}
          onChange={(v) => update("damageResistances", v)}
          presets={COMMON_DAMAGE_TAGS}
        />
      </section>

      <section className="creature-editor__section">
        <h2>Damage Immunities</h2>
        <TagSelect
          value={data.damageImmunities}
          onChange={(v) => update("damageImmunities", v)}
          presets={COMMON_DAMAGE_TAGS}
        />
      </section>

      <section className="creature-editor__section">
        <h2>Condition Immunities</h2>
        <TagSelect
          value={data.conditionImmunities}
          onChange={(v) => update("conditionImmunities", v)}
          presets={COMMON_CONDITIONS}
        />
      </section>

      {/* Senses & Languages */}
      <section className="creature-editor__section">
        <h2>Senses</h2>
        <div className="creature-editor__senses">
          <SenseRow
            label="Passive Perception"
            value={data.senses.passivePerception}
            onChange={(v) => updateSense("passivePerception", v)}
            calculatedValue={resolvePassivePerception(data)}
          />
          <SenseRow
            label="Darkvision"
            value={data.senses.darkvision}
            onChange={(v) => updateSense("darkvision", v)}
          />
          <SenseRow
            label="Blindsight"
            value={data.senses.blindsight}
            onChange={(v) => updateSense("blindsight", v)}
          />
          <SenseRow
            label="Tremorsense"
            value={data.senses.tremorsense}
            onChange={(v) => updateSense("tremorsense", v)}
          />
          <SenseRow
            label="Truesight"
            value={data.senses.truesight}
            onChange={(v) => updateSense("truesight", v)}
          />
        </div>
      </section>

      <section className="creature-editor__section">
        <h2>Languages</h2>
        <textarea
          rows={2}
          className="creature-editor__textarea"
          value={data.languages}
          onChange={(e) => update("languages", e.target.value)}
          placeholder="Common, Draconic, telepathy 60 ft."
        />
      </section>

      {/* Traits & Actions */}
      <section className="creature-editor__section">
        <h2>Traits</h2>
        <AbilityEntryList value={data.traits} onChange={(v) => update("traits", v)} addLabel="Add Trait" />
      </section>

      <section className="creature-editor__section">
        <h2>Actions</h2>
        <AbilityEntryList
          value={data.actions}
          onChange={(v) => update("actions", v)}
          addLabel="Add Action"
        />
      </section>

      {/* Advanced */}
      <h2 className="creature-editor__advanced-heading">Advanced</h2>

      <CollapsibleSection title="Bonus Actions">
        <AbilityEntryList
          value={data.bonusActions}
          onChange={(v) => update("bonusActions", v)}
          addLabel="Add Bonus Action"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Reactions">
        <AbilityEntryList
          value={data.reactions}
          onChange={(v) => update("reactions", v)}
          addLabel="Add Reaction"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Legendary Actions">
        <AbilityEntryList
          value={data.legendaryActions}
          onChange={(v) => update("legendaryActions", v)}
          addLabel="Add Legendary Action"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Lair Actions">
        <AbilityEntryList
          value={data.lairActions}
          onChange={(v) => update("lairActions", v)}
          addLabel="Add Lair Action"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Mythic Actions">
        <AbilityEntryList
          value={data.mythicActions}
          onChange={(v) => update("mythicActions", v)}
          addLabel="Add Mythic Action"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Spellcasting">
        <SpellcastingFields value={data.spellcasting} onChange={(v) => update("spellcasting", v)} />
      </CollapsibleSection>

      <CollapsibleSection title="Innate Spellcasting">
        <SpellcastingFields
          value={data.innateSpellcasting}
          onChange={(v) => update("innateSpellcasting", v)}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Regional Effects">
        <ChipInput
          value={data.regionalEffects}
          onChange={(v) => update("regionalEffects", v)}
          placeholder="Add a regional effect..."
        />
      </CollapsibleSection>

      <CollapsibleSection title="Equipment">
        <InventoryList value={data.equipment} onChange={(v) => update("equipment", v)} />
      </CollapsibleSection>

      <CollapsibleSection title="Loot Table">
        <LootTableList value={data.lootTable} onChange={(v) => update("lootTable", v)} />
      </CollapsibleSection>

      <CollapsibleSection title="Notes">
        <textarea
          rows={4}
          className="creature-editor__textarea"
          value={data.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Artwork">
        <ArtworkField value={data.artworkDataUrl} onChange={(v) => update("artworkDataUrl", v)} />
      </CollapsibleSection>

      <CollapsibleSection title="Tags">
        <ChipInput value={data.tags} onChange={(v) => update("tags", v)} placeholder="Add a tag..." />
      </CollapsibleSection>
    </div>
  );
}
