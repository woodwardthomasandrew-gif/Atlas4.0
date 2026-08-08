import type { AssetEditorProps } from "@app/plugin-api/types";
import { Input } from "@ui/components";
import {
  DAMAGE_DIE_TYPES,
  DAMAGE_TYPES,
  ITEM_RARITIES,
  RECHARGE_TIMINGS,
  createDefaultCharges,
  createDefaultDamage,
  type ItemCharges,
  type ItemDamage,
  type MagicItemData
} from "../schema";
import "./MagicItemEditor.css";

export function MagicItemEditor({ data, onChange }: AssetEditorProps<MagicItemData>): JSX.Element {
  const update = <K extends keyof MagicItemData>(key: K, value: MagicItemData[K]): void => {
    onChange({ ...data, [key]: value });
  };

  const updateCharges = <K extends keyof ItemCharges>(key: K, value: ItemCharges[K]): void => {
    onChange({ ...data, charges: { ...data.charges, [key]: value } });
  };

  const updateDamage = <K extends keyof ItemDamage>(key: K, value: ItemDamage[K]): void => {
    onChange({ ...data, damage: { ...data.damage, [key]: value } });
  };

  return (
    <div className="magic-item-editor">
      <div className="magic-item-editor__row">
        <label className="magic-item-editor__field">
          <span>Item Type</span>
          <Input
            value={data.itemType}
            placeholder="Wondrous item, weapon, armor..."
            onChange={(e) => update("itemType", e.target.value)}
          />
        </label>

        <label className="magic-item-editor__field">
          <span>Rarity</span>
          <select
            className="magic-item-editor__select"
            value={data.rarity}
            onChange={(e) => update("rarity", e.target.value as MagicItemData["rarity"])}
          >
            {ITEM_RARITIES.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="magic-item-editor__field magic-item-editor__field--inline">
        <input
          type="checkbox"
          checked={data.requiresAttunement}
          onChange={(e) => update("requiresAttunement", e.target.checked)}
        />
        <span>Requires Attunement</span>
      </label>

      <div className="magic-item-editor__row">
        <label className="magic-item-editor__field">
          <span>Weight (lb)</span>
          <Input
            type="number"
            min={0}
            step="any"
            value={data.weightLb}
            onChange={(e) => update("weightLb", Number(e.target.value))}
          />
        </label>

        <label className="magic-item-editor__field">
          <span>Value (gp)</span>
          <Input
            type="number"
            min={0}
            step="any"
            value={data.valueGp}
            onChange={(e) => update("valueGp", Number(e.target.value))}
          />
        </label>
      </div>

      <label className="magic-item-editor__field">
        <span>Flavor Text</span>
        <textarea
          className="magic-item-editor__textarea"
          rows={4}
          placeholder="Lore, appearance, history — the flavorful description of the item."
          value={data.flavorText}
          onChange={(e) => update("flavorText", e.target.value)}
        />
      </label>

      <label className="magic-item-editor__field">
        <span>Mechanical Text</span>
        <textarea
          className="magic-item-editor__textarea"
          rows={6}
          placeholder="Rules text — what the item actually does."
          value={data.mechanicalText}
          onChange={(e) => update("mechanicalText", e.target.value)}
        />
      </label>

      <fieldset className="magic-item-editor__fieldset">
        <label className="magic-item-editor__field magic-item-editor__field--inline">
          <input
            type="checkbox"
            checked={data.hasCharges}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange({
                ...data,
                hasCharges: checked,
                charges: checked ? data.charges ?? createDefaultCharges() : data.charges
              });
            }}
          />
          <span>Has Charges</span>
        </label>

        {data.hasCharges && (
          <div className="magic-item-editor__subform">
            <div className="magic-item-editor__row">
              <label className="magic-item-editor__field">
                <span>Max Charges</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={data.charges.max}
                  onChange={(e) => updateCharges("max", Number(e.target.value))}
                />
              </label>

              <label className="magic-item-editor__field">
                <span>Current Charges</span>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={data.charges.current}
                  onChange={(e) => updateCharges("current", Number(e.target.value))}
                />
              </label>
            </div>

            <div className="magic-item-editor__row">
              <label className="magic-item-editor__field">
                <span>Recharge Formula</span>
                <Input
                  placeholder="e.g. 1d6+2 (optional — leave blank to refill to max)"
                  value={data.charges.rechargeFormula}
                  onChange={(e) => updateCharges("rechargeFormula", e.target.value)}
                />
              </label>

              <label className="magic-item-editor__field">
                <span>Recharge Timing</span>
                <select
                  className="magic-item-editor__select"
                  value={data.charges.rechargeTiming}
                  onChange={(e) =>
                    updateCharges("rechargeTiming", e.target.value as ItemCharges["rechargeTiming"])
                  }
                >
                  {RECHARGE_TIMINGS.map((timing) => (
                    <option key={timing} value={timing}>
                      {timing}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="magic-item-editor__fieldset">
        <label className="magic-item-editor__field magic-item-editor__field--inline">
          <input
            type="checkbox"
            checked={data.hasDamage}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange({
                ...data,
                hasDamage: checked,
                damage: checked ? data.damage ?? createDefaultDamage() : data.damage
              });
            }}
          />
          <span>Deals Damage</span>
        </label>

        {data.hasDamage && (
          <div className="magic-item-editor__subform">
            <div className="magic-item-editor__row">
              <label className="magic-item-editor__field">
                <span># of Dice</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={data.damage.diceCount}
                  onChange={(e) => updateDamage("diceCount", Number(e.target.value))}
                />
              </label>

              <label className="magic-item-editor__field">
                <span>Die Type</span>
                <select
                  className="magic-item-editor__select"
                  value={data.damage.diceType}
                  onChange={(e) => updateDamage("diceType", e.target.value as ItemDamage["diceType"])}
                >
                  {DAMAGE_DIE_TYPES.map((die) => (
                    <option key={die} value={die}>
                      {die}
                    </option>
                  ))}
                </select>
              </label>

              <label className="magic-item-editor__field">
                <span>Bonus</span>
                <Input
                  type="number"
                  step={1}
                  value={data.damage.bonus}
                  onChange={(e) => updateDamage("bonus", Number(e.target.value))}
                />
              </label>
            </div>

            <label className="magic-item-editor__field">
              <span>Damage Type</span>
              <select
                className="magic-item-editor__select"
                value={data.damage.damageType}
                onChange={(e) => updateDamage("damageType", e.target.value as ItemDamage["damageType"])}
              >
                {DAMAGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </fieldset>
    </div>
  );
}
