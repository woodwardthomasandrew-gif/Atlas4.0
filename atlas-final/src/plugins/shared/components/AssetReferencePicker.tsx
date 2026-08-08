import { useEffect, useState } from "react";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { getAssetType } from "@app/registry/assetRegistry";
import "./AssetReferencePicker.css";

export interface AssetReference {
  assetId: string;
  name: string;
}

export interface AssetReferencePickerProps {
  /** The registered asset type to pick from, e.g. "magic-item" or "spell". */
  assetType: string;
  onPick: (reference: AssetReference) => void;
}

/**
 * A dropdown of saved assets of a given type. Degrades gracefully if that
 * plugin isn't registered yet (e.g. referencing "spell" before the Spell
 * Builder plugin exists) — shows a note instead of throwing.
 */
export function AssetReferencePicker({ assetType, onPick }: AssetReferencePickerProps): JSX.Element {
  const [records, setRecords] = useState<AssetRecord[] | null>(null);
  const definition = getAssetType(assetType);

  useEffect(() => {
    let cancelled = false;
    listAssets(assetType).then((rows) => {
      if (!cancelled) setRecords(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [assetType]);

  if (!definition) {
    return (
      <p className="asset-reference-picker__note">
        The "{assetType}" builder isn't installed yet, so entries can't be referenced from here.
      </p>
    );
  }

  if (records === null) {
    return <p className="asset-reference-picker__note">Loading {definition.pluralLabel.toLowerCase()}…</p>;
  }

  if (records.length === 0) {
    return (
      <p className="asset-reference-picker__note">
        No saved {definition.pluralLabel.toLowerCase()} yet.
      </p>
    );
  }

  return (
    <select
      className="asset-reference-picker__select"
      defaultValue=""
      onChange={(e) => {
        const record = records.find((r) => r.id === e.target.value);
        if (record) {
          onPick({ assetId: record.id, name: record.name });
        }
        e.target.value = "";
      }}
    >
      <option value="" disabled>
        Add from {definition.pluralLabel}...
      </option>
      {records.map((record) => (
        <option key={record.id} value={record.id}>
          {record.name}
        </option>
      ))}
    </select>
  );
}
