import { Button, Input } from "@ui/components";
import { AssetReferencePicker } from "@plugins/shared/components/AssetReferencePicker";
import { createEquipmentEntry, type EquipmentEntry } from "../schema";
import "./InventoryList.css";

const ITEM_ASSET_TYPE = "magic-item";

export interface InventoryListProps {
  value: EquipmentEntry[];
  onChange: (value: EquipmentEntry[]) => void;
}

export function InventoryList({ value, onChange }: InventoryListProps): JSX.Element {
  const update = (id: string, patch: Partial<EquipmentEntry>): void => {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const remove = (id: string): void => {
    onChange(value.filter((entry) => entry.id !== id));
  };

  const addGeneric = (): void => {
    onChange([...value, createEquipmentEntry()]);
  };

  return (
    <div className="inventory-list">
      {value.map((entry) => (
        <div key={entry.id} className="inventory-list__row">
          {entry.kind === "reference" ? (
            <span className="inventory-list__ref-name">{entry.name} (item reference)</span>
          ) : (
            <Input
              className="inventory-list__name"
              placeholder="Item name"
              value={entry.name}
              onChange={(e) => update(entry.id, { name: e.target.value })}
            />
          )}
          <Input
            className="inventory-list__quantity"
            placeholder="Qty"
            value={entry.quantity}
            onChange={(e) => update(entry.id, { quantity: e.target.value })}
          />
          <Input
            className="inventory-list__notes"
            placeholder="Notes"
            value={entry.notes}
            onChange={(e) => update(entry.id, { notes: e.target.value })}
          />
          <Button variant="ghost" onClick={() => remove(entry.id)}>
            Remove
          </Button>
        </div>
      ))}

      <div className="inventory-list__add-row">
        <Button variant="secondary" onClick={addGeneric}>
          Add Generic Entry
        </Button>
        <AssetReferencePicker
          assetType={ITEM_ASSET_TYPE}
          onPick={(ref) =>
            onChange([
              ...value,
              { ...createEquipmentEntry(), kind: "reference", assetId: ref.assetId, name: ref.name }
            ])
          }
        />
      </div>
    </div>
  );
}
