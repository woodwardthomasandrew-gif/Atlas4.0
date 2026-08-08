import { useState } from "react";
import { Button, Input } from "@ui/components";
import { DAMAGE_DIE_TYPES, DAMAGE_TYPES, createDefaultDamage, type ItemDamage } from "@plugins/shared/damage";
import { ComponentLibraryPicker } from "@plugins/shared/components/ComponentLibraryPicker";
import { saveCustomComponent, type ComponentRecord } from "@app/db/componentStore";
import { createAbilityEntry, type CreatureAbilityEntry } from "../schema";
import "./AbilityEntryList.css";

export interface AbilityEntryListProps {
  value: CreatureAbilityEntry[];
  onChange: (value: CreatureAbilityEntry[]) => void;
  addLabel: string;
  /** Which reusable-component slot this list fills, e.g. "trait" or "action". */
  componentType: string;
}

/** Structured extras an ability entry carries beyond name/description. */
interface ComponentPayload {
  attackBonus: number | null;
  damage: ItemDamage | null;
  saveDC: number | null;
  extraAttacksCount: number | null;
}

/**
 * Builds an independent entry from a library component. This is the
 * "insert as a copy" step: nothing here keeps a reference back to
 * component.id, so later edits to the entry or to the library component
 * can never affect one another.
 */
function entryFromComponent(component: ComponentRecord): CreatureAbilityEntry {
  const payload = (component.data ?? {}) as Partial<ComponentPayload>;
  return {
    id: crypto.randomUUID(),
    name: component.name,
    description: component.description,
    attackBonus: payload.attackBonus ?? null,
    damage: payload.damage ? { ...payload.damage } : null,
    saveDC: payload.saveDC ?? null,
    extraAttacksCount: payload.extraAttacksCount ?? null
  };
}

export function AbilityEntryList({
  value,
  onChange,
  addLabel,
  componentType
}: AbilityEntryListProps): JSX.Element {
  const [showPicker, setShowPicker] = useState(false);
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saveTags, setSaveTags] = useState("");

  const update = (id: string, patch: Partial<CreatureAbilityEntry>): void => {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const updateDamage = (id: string, patch: Partial<ItemDamage>): void => {
    const entry = value.find((e) => e.id === id);
    if (!entry || !entry.damage) return;
    update(id, { damage: { ...entry.damage, ...patch } });
  };

  const remove = (id: string): void => {
    onChange(value.filter((entry) => entry.id !== id));
  };

  const add = (): void => {
    onChange([...value, createAbilityEntry()]);
  };

  const insertFromLibrary = (component: ComponentRecord): void => {
    onChange([...value, entryFromComponent(component)]);
  };

  const startSaveToLibrary = (entry: CreatureAbilityEntry): void => {
    setSavingEntryId(entry.id);
    setSaveName(entry.name);
    setSaveTags("");
  };

  const cancelSaveToLibrary = (): void => {
    setSavingEntryId(null);
    setSaveName("");
    setSaveTags("");
  };

  const confirmSaveToLibrary = async (entry: CreatureAbilityEntry): Promise<void> => {
    const name = saveName.trim();
    if (!name) return;
    const tags = saveTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: ComponentPayload = {
      attackBonus: entry.attackBonus,
      damage: entry.damage,
      saveDC: entry.saveDC,
      extraAttacksCount: entry.extraAttacksCount
    };

    await saveCustomComponent({
      componentType,
      name,
      description: entry.description,
      tags,
      data: payload
    });

    cancelSaveToLibrary();
  };

  return (
    <div className="ability-entry-list">
      {value.map((entry) => {
        const hasStats = entry.attackBonus !== null || entry.damage !== null || entry.saveDC !== null;
        const isSaving = savingEntryId === entry.id;

        return (
          <div key={entry.id} className="ability-entry-list__card">
            <div className="ability-entry-list__row">
              <Input
                className="ability-entry-list__name"
                placeholder="Name"
                value={entry.name}
                onChange={(e) => update(entry.id, { name: e.target.value })}
              />
              <Button
                variant="ghost"
                onClick={() => (isSaving ? cancelSaveToLibrary() : startSaveToLibrary(entry))}
                title="Save this entry as a reusable component"
              >
                {isSaving ? "Cancel" : "Save to Library"}
              </Button>
              <Button variant="ghost" onClick={() => remove(entry.id)}>
                Remove
              </Button>
            </div>

            {isSaving && (
              <div className="ability-entry-list__save-form">
                <label className="ability-entry-list__stat-field">
                  <span>Library name</span>
                  <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} />
                </label>
                <label className="ability-entry-list__stat-field">
                  <span>Tags (comma separated)</span>
                  <Input
                    value={saveTags}
                    onChange={(e) => setSaveTags(e.target.value)}
                    placeholder="combat, fire..."
                  />
                </label>
                <Button variant="primary" onClick={() => confirmSaveToLibrary(entry)}>
                  Save
                </Button>
              </div>
            )}

            <textarea
              className="ability-entry-list__description"
              placeholder="Description"
              rows={3}
              value={entry.description}
              onChange={(e) => update(entry.id, { description: e.target.value })}
            />

            <label className="ability-entry-list__toggle">
              <input
                type="checkbox"
                checked={hasStats}
                onChange={(e) => {
                  if (e.target.checked) {
                    update(entry.id, { attackBonus: 0, saveDC: null, damage: null });
                  } else {
                    update(entry.id, {
                      attackBonus: null,
                      saveDC: null,
                      damage: null,
                      extraAttacksCount: null
                    });
                  }
                }}
              />
              <span>Structured combat stats (for CR estimation later)</span>
            </label>

            {hasStats && (
              <div className="ability-entry-list__stats">
                <label className="ability-entry-list__stat-field">
                  <span>Attack Bonus</span>
                  <Input
                    type="number"
                    value={entry.attackBonus ?? 0}
                    onChange={(e) => update(entry.id, { attackBonus: Number(e.target.value) })}
                  />
                </label>

                <label className="ability-entry-list__stat-field">
                  <span>Save DC</span>
                  <Input
                    type="number"
                    value={entry.saveDC ?? 0}
                    onChange={(e) => update(entry.id, { saveDC: Number(e.target.value) })}
                  />
                </label>

                <label className="ability-entry-list__stat-field">
                  <span># Attacks</span>
                  <Input
                    type="number"
                    min={1}
                    value={entry.extraAttacksCount ?? 1}
                    onChange={(e) => update(entry.id, { extraAttacksCount: Number(e.target.value) })}
                  />
                </label>

                <label className="ability-entry-list__stat-field ability-entry-list__stat-field--checkbox">
                  <input
                    type="checkbox"
                    checked={entry.damage !== null}
                    onChange={(e) =>
                      update(entry.id, { damage: e.target.checked ? createDefaultDamage() : null })
                    }
                  />
                  <span>Deals Damage</span>
                </label>

                {entry.damage && (
                  <div className="ability-entry-list__damage-row">
                    <Input
                      type="number"
                      min={1}
                      value={entry.damage.diceCount}
                      onChange={(e) => updateDamage(entry.id, { diceCount: Number(e.target.value) })}
                    />
                    <select
                      value={entry.damage.diceType}
                      onChange={(e) =>
                        updateDamage(entry.id, { diceType: e.target.value as ItemDamage["diceType"] })
                      }
                    >
                      {DAMAGE_DIE_TYPES.map((die) => (
                        <option key={die} value={die}>
                          {die}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      value={entry.damage.bonus}
                      onChange={(e) => updateDamage(entry.id, { bonus: Number(e.target.value) })}
                    />
                    <select
                      value={entry.damage.damageType}
                      onChange={(e) =>
                        updateDamage(entry.id, { damageType: e.target.value as ItemDamage["damageType"] })
                      }
                    >
                      {DAMAGE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="ability-entry-list__add-row">
        <Button variant="secondary" onClick={add}>
          {addLabel}
        </Button>
        <Button variant="secondary" onClick={() => setShowPicker(true)}>
          From Library
        </Button>
      </div>

      {showPicker && (
        <ComponentLibraryPicker
          componentType={componentType}
          onInsert={insertFromLibrary}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
