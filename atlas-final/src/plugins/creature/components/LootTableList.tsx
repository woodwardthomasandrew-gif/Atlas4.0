import { Button, Input } from "@ui/components";
import { AssetReferencePicker } from "@plugins/shared/components/AssetReferencePicker";
import { createLootTableEntry, type LootTableEntry } from "../schema";
import "./LootTableList.css";

const ITEM_ASSET_TYPE = "magic-item";

export interface LootTableListProps {
  value: LootTableEntry[];
  onChange: (value: LootTableEntry[]) => void;
}

export function LootTableList({ value, onChange }: LootTableListProps): JSX.Element {
  const update = (id: string, patch: Partial<LootTableEntry>): void => {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const remove = (id: string): void => {
    onChange(value.filter((entry) => entry.id !== id));
  };

  const addGeneric = (): void => {
    onChange([...value, createLootTableEntry()]);
  };

  return (
    <div className="loot-table-list">
      {value.map((entry) => (
        <div key={entry.id} className="loot-table-list__card">
          <div className="loot-table-list__row">
            {entry.kind === "reference" ? (
              <span className="loot-table-list__ref-name">{entry.name} (item reference)</span>
            ) : (
              <Input
                className="loot-table-list__name"
                placeholder="Item name"
                value={entry.name}
                onChange={(e) => update(entry.id, { name: e.target.value })}
              />
            )}
            <Button variant="ghost" onClick={() => remove(entry.id)}>
              Remove
            </Button>
          </div>

          <div className="loot-table-list__variance">
            <label className="loot-table-list__field">
              <span>Qty Min</span>
              <Input
                type="number"
                min={0}
                value={entry.quantityMin}
                onChange={(e) => update(entry.id, { quantityMin: Number(e.target.value) })}
              />
            </label>
            <label className="loot-table-list__field">
              <span>Qty Max</span>
              <Input
                type="number"
                min={0}
                value={entry.quantityMax}
                onChange={(e) => update(entry.id, { quantityMax: Number(e.target.value) })}
              />
            </label>
            <label className="loot-table-list__field">
              <span>Drop %</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={entry.dropChancePercent}
                onChange={(e) => update(entry.id, { dropChancePercent: Number(e.target.value) })}
              />
            </label>
            <Input
              className="loot-table-list__notes"
              placeholder="Notes"
              value={entry.notes}
              onChange={(e) => update(entry.id, { notes: e.target.value })}
            />
          </div>
        </div>
      ))}

      <div className="loot-table-list__add-row">
        <Button variant="secondary" onClick={addGeneric}>
          Add Generic Loot Entry
        </Button>
        <AssetReferencePicker
          assetType={ITEM_ASSET_TYPE}
          onPick={(ref) =>
            onChange([
              ...value,
              { ...createLootTableEntry(), kind: "reference", assetId: ref.assetId, name: ref.name }
            ])
          }
        />
      </div>
    </div>
  );
}
