import { Input } from "@ui/components";
import { AssetReferencePicker } from "@plugins/shared/components/AssetReferencePicker";
import type { AbilityKey, SpellcastingBlock } from "../schema";
import "./SpellcastingFields.css";

const SPELL_ASSET_TYPE = "spell";

/** Reads the stored spell level off a picked asset's raw data (0 for cantrips, falls back to 0 if absent). */
function extractSpellLevel(data: unknown): number {
  if (data && typeof data === "object" && "level" in data) {
    const level = (data as { level?: unknown }).level;
    if (typeof level === "number") return level;
  }
  return 0;
}

const ABILITY_OPTIONS: AbilityKey[] = ["int", "wis", "cha"];

export interface SpellcastingFieldsProps {
  value: SpellcastingBlock;
  onChange: (value: SpellcastingBlock) => void;
}

export function SpellcastingFields({ value, onChange }: SpellcastingFieldsProps): JSX.Element {
  return (
    <div className="spellcasting-fields">
      <label className="spellcasting-fields__enable">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
        />
        <span>Enabled</span>
      </label>

      {value.enabled && (
        <div className="spellcasting-fields__body">
          <div className="spellcasting-fields__row">
            <label className="spellcasting-fields__field">
              <span>Ability</span>
              <select
                value={value.ability}
                onChange={(e) => onChange({ ...value, ability: e.target.value as AbilityKey })}
              >
                {ABILITY_OPTIONS.map((ability) => (
                  <option key={ability} value={ability}>
                    {ability.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="spellcasting-fields__field">
              <span>Save DC</span>
              <Input
                type="number"
                value={value.saveDC}
                onChange={(e) => onChange({ ...value, saveDC: Number(e.target.value) })}
              />
            </label>

            <label className="spellcasting-fields__field">
              <span>Attack Bonus</span>
              <Input
                type="number"
                value={value.attackBonus}
                onChange={(e) => onChange({ ...value, attackBonus: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="spellcasting-fields__refs">
            {value.spellRefs.map((ref) => (
              <span key={ref.assetId} className="spellcasting-fields__chip">
                {ref.name}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      spellRefs: value.spellRefs.filter((r) => r.assetId !== ref.assetId)
                    })
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <AssetReferencePicker
            assetType={SPELL_ASSET_TYPE}
            onPick={(ref) => {
              if (value.spellRefs.some((r) => r.assetId === ref.assetId)) return;
              const level = extractSpellLevel(ref.data);
              onChange({ ...value, spellRefs: [...value.spellRefs, { assetId: ref.assetId, name: ref.name, level }] });
            }}
          />

          <label className="spellcasting-fields__field">
            <span>Freeform Notes</span>
            <textarea
              rows={3}
              placeholder="Casting stats, at-will vs. per-day text, etc."
              value={value.freeformNotes}
              onChange={(e) => onChange({ ...value, freeformNotes: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}

