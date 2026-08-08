import type { AssetEditorProps } from "@app/plugin-api/types";
import { Input } from "@ui/components";
import { CollapsibleSection } from "@plugins/shared/components/CollapsibleSection";
import { TagSelect } from "@plugins/shared/components/TagSelect";
import { ChipInput } from "@plugins/shared/components/ChipInput";
import { ArtworkField } from "@plugins/shared/components/ArtworkField";
import {
  DAMAGE_DIE_TYPES,
  DAMAGE_TYPES,
  createDefaultDamage,
  type ItemDamage
} from "@plugins/shared/damage";
import { ABILITY_KEYS, type AbilityKey } from "@plugins/shared/abilities";
import { COMMON_CONDITIONS } from "@plugins/shared/presets";
import {
  AREA_OF_EFFECT_SHAPES,
  SPELL_LEVELS,
  SPELL_SCHOOLS,
  type AreaOfEffectShape,
  type SpellData,
  type SpellResolution,
  type SpellSchool
} from "../schema";
import "./SpellEditor.css";

export function SpellEditor({ data, onChange }: AssetEditorProps<SpellData>): JSX.Element {
  const update = <K extends keyof SpellData>(key: K, value: SpellData[K]): void => {
    onChange({ ...data, [key]: value });
  };

  const updateDamage = (patch: Partial<ItemDamage>): void => {
    update("damage", { ...data.damage, ...patch });
  };

  const updateHealing = (patch: Partial<ItemDamage>): void => {
    update("healing", { ...data.healing, ...patch });
  };

  return (
    <div className="spell-editor">
      {/* Basic Information */}
      <section className="spell-editor__section">
        <h2>Basic Information</h2>
        <div className="spell-editor__row">
          <label className="spell-editor__field">
            <span>Level</span>
            <select
              value={data.level}
              onChange={(e) => update("level", Number(e.target.value))}
            >
              {SPELL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level === 0 ? "Cantrip" : level}
                </option>
              ))}
            </select>
          </label>

          <label className="spell-editor__field">
            <span>School</span>
            <select
              value={data.school}
              onChange={(e) => update("school", e.target.value as SpellSchool)}
            >
              {SPELL_SCHOOLS.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="spell-editor__row">
          <label className="spell-editor__field spell-editor__field--inline">
            <input
              type="checkbox"
              checked={data.ritual}
              onChange={(e) => update("ritual", e.target.checked)}
            />
            <span>Ritual</span>
          </label>
          <label className="spell-editor__field spell-editor__field--inline">
            <input
              type="checkbox"
              checked={data.concentration}
              onChange={(e) => update("concentration", e.target.checked)}
            />
            <span>Concentration</span>
          </label>
        </div>
      </section>

      {/* Casting */}
      <section className="spell-editor__section">
        <h2>Casting</h2>
        <div className="spell-editor__row">
          <label className="spell-editor__field">
            <span>Casting Time</span>
            <Input
              value={data.castingTime}
              placeholder="1 action, 1 bonus action, 1 minute..."
              onChange={(e) => update("castingTime", e.target.value)}
            />
          </label>
          <label className="spell-editor__field">
            <span>Range</span>
            <Input
              value={data.range}
              placeholder="60 feet, Self, Touch..."
              onChange={(e) => update("range", e.target.value)}
            />
          </label>
        </div>

        <div className="spell-editor__field">
          <span>Components</span>
          <div className="spell-editor__components-row">
            <label className="spell-editor__field--inline">
              <input
                type="checkbox"
                checked={data.components.verbal}
                onChange={(e) =>
                  update("components", { ...data.components, verbal: e.target.checked })
                }
              />
              <span>Verbal</span>
            </label>
            <label className="spell-editor__field--inline">
              <input
                type="checkbox"
                checked={data.components.somatic}
                onChange={(e) =>
                  update("components", { ...data.components, somatic: e.target.checked })
                }
              />
              <span>Somatic</span>
            </label>
            <label className="spell-editor__field--inline">
              <input
                type="checkbox"
                checked={data.components.material}
                onChange={(e) =>
                  update("components", { ...data.components, material: e.target.checked })
                }
              />
              <span>Material</span>
            </label>
          </div>
          {data.components.material && (
            <Input
              placeholder="Material Description"
              value={data.components.materialDescription}
              onChange={(e) =>
                update("components", { ...data.components, materialDescription: e.target.value })
              }
            />
          )}
        </div>

        <label className="spell-editor__field">
          <span>Duration</span>
          <Input
            value={data.duration}
            placeholder="Instantaneous, 1 minute, Until dispelled..."
            onChange={(e) => update("duration", e.target.value)}
          />
        </label>
      </section>

      {/* Description */}
      <section className="spell-editor__section">
        <h2>Description</h2>
        <textarea
          className="spell-editor__textarea"
          rows={8}
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </section>

      {/* Advanced */}
      <h2 className="spell-editor__advanced-heading">Advanced</h2>

      <CollapsibleSection title="Higher Level Scaling">
        <label className="spell-editor__field--inline">
          <input
            type="checkbox"
            checked={data.scaling.canUpcast}
            onChange={(e) => update("scaling", { ...data.scaling, canUpcast: e.target.checked })}
          />
          <span>Can be cast at a higher level</span>
        </label>
        {data.scaling.canUpcast && (
          <textarea
            className="spell-editor__textarea"
            rows={3}
            placeholder="e.g. the damage increases by 1d6 for each slot level above 1st."
            value={data.scaling.description}
            onChange={(e) => update("scaling", { ...data.scaling, description: e.target.value })}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Attack Roll / Saving Throw">
        <label className="spell-editor__field">
          <span>Resolution</span>
          <select
            value={data.resolution}
            onChange={(e) => update("resolution", e.target.value as SpellResolution)}
          >
            <option value="none">None</option>
            <option value="attack">Attack Roll</option>
            <option value="save">Saving Throw</option>
          </select>
        </label>

        {data.resolution === "save" && (
          <div className="spell-editor__row">
            <label className="spell-editor__field">
              <span>Ability</span>
              <select
                value={data.savingThrowAbility}
                onChange={(e) => update("savingThrowAbility", e.target.value as AbilityKey)}
              >
                {ABILITY_KEYS.map((ability) => (
                  <option key={ability} value={ability}>
                    {ability.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="spell-editor__field--inline">
              <input
                type="checkbox"
                checked={data.halfDamageOnSave}
                onChange={(e) => update("halfDamageOnSave", e.target.checked)}
              />
              <span>Half damage on success</span>
            </label>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Damage">
        <label className="spell-editor__field--inline">
          <input
            type="checkbox"
            checked={data.hasDamage}
            onChange={(e) =>
              onChange({
                ...data,
                hasDamage: e.target.checked,
                damage: e.target.checked ? data.damage ?? createDefaultDamage() : data.damage
              })
            }
          />
          <span>Deals Damage</span>
        </label>
        {data.hasDamage && (
          <div className="spell-editor__damage-row">
            <Input
              type="number"
              min={1}
              value={data.damage.diceCount}
              onChange={(e) => updateDamage({ diceCount: Number(e.target.value) })}
            />
            <select
              value={data.damage.diceType}
              onChange={(e) => updateDamage({ diceType: e.target.value as ItemDamage["diceType"] })}
            >
              {DAMAGE_DIE_TYPES.map((die) => (
                <option key={die} value={die}>
                  {die}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={data.damage.bonus}
              onChange={(e) => updateDamage({ bonus: Number(e.target.value) })}
            />
            <select
              value={data.damage.damageType}
              onChange={(e) => updateDamage({ damageType: e.target.value as ItemDamage["damageType"] })}
            >
              {DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Healing">
        <label className="spell-editor__field--inline">
          <input
            type="checkbox"
            checked={data.hasHealing}
            onChange={(e) =>
              onChange({
                ...data,
                hasHealing: e.target.checked,
                healing: e.target.checked ? data.healing ?? createDefaultDamage() : data.healing
              })
            }
          />
          <span>Heals</span>
        </label>
        {data.hasHealing && (
          <div className="spell-editor__damage-row">
            <Input
              type="number"
              min={1}
              value={data.healing.diceCount}
              onChange={(e) => updateHealing({ diceCount: Number(e.target.value) })}
            />
            <select
              value={data.healing.diceType}
              onChange={(e) => updateHealing({ diceType: e.target.value as ItemDamage["diceType"] })}
            >
              {DAMAGE_DIE_TYPES.map((die) => (
                <option key={die} value={die}>
                  {die}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={data.healing.bonus}
              onChange={(e) => updateHealing({ bonus: Number(e.target.value) })}
            />
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Area of Effect">
        <div className="spell-editor__row">
          <label className="spell-editor__field">
            <span>Shape</span>
            <select
              value={data.areaOfEffect.shape}
              onChange={(e) =>
                update("areaOfEffect", {
                  ...data.areaOfEffect,
                  shape: e.target.value as AreaOfEffectShape
                })
              }
            >
              {AREA_OF_EFFECT_SHAPES.map((shape) => (
                <option key={shape} value={shape}>
                  {shape}
                </option>
              ))}
            </select>
          </label>
          <label className="spell-editor__field">
            <span>Size (ft)</span>
            <Input
              type="number"
              min={0}
              value={data.areaOfEffect.sizeFt}
              onChange={(e) =>
                update("areaOfEffect", { ...data.areaOfEffect, sizeFt: Number(e.target.value) })
              }
            />
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Conditions Applied">
        <TagSelect
          value={data.conditionsApplied}
          onChange={(v) => update("conditionsApplied", v)}
          presets={COMMON_CONDITIONS}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Classes">
        <ChipInput
          value={data.classes}
          onChange={(v) => update("classes", v)}
          placeholder="Add a class..."
        />
      </CollapsibleSection>

      <CollapsibleSection title="Tags">
        <ChipInput value={data.tags} onChange={(v) => update("tags", v)} placeholder="Add a tag..." />
      </CollapsibleSection>

      <CollapsibleSection title="Artwork">
        <ArtworkField value={data.artworkDataUrl} onChange={(v) => update("artworkDataUrl", v)} />
      </CollapsibleSection>

      <CollapsibleSection title="Designer Notes">
        <textarea
          className="spell-editor__textarea"
          rows={4}
          value={data.designerNotes}
          onChange={(e) => update("designerNotes", e.target.value)}
        />
      </CollapsibleSection>
    </div>
  );
}
