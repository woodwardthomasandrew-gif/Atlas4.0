import type { AssetEditorProps } from "@app/plugin-api/types";
import { Input } from "@ui/components";
import { ITEM_RARITIES, type MagicItemData } from "../schema";
import "./MagicItemEditor.css";

export function MagicItemEditor({ data, onChange }: AssetEditorProps<MagicItemData>): JSX.Element {
  const update = <K extends keyof MagicItemData>(key: K, value: MagicItemData[K]): void => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="magic-item-editor">
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

      <label className="magic-item-editor__field magic-item-editor__field--inline">
        <input
          type="checkbox"
          checked={data.requiresAttunement}
          onChange={(e) => update("requiresAttunement", e.target.checked)}
        />
        <span>Requires Attunement</span>
      </label>

      <label className="magic-item-editor__field">
        <span>Description</span>
        <textarea
          className="magic-item-editor__textarea"
          rows={8}
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </label>
    </div>
  );
}
