import { Input } from "@ui/components";
import "./AssetSearchField.css";

export interface AssetSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AssetSearchField({
  value,
  onChange,
  placeholder = "Search by name…"
}: AssetSearchFieldProps): JSX.Element {
  return (
    <div className="asset-search-field">
      <Input
        type="search"
        aria-label="Search assets by name"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value.length > 0 && (
        <button
          type="button"
          className="asset-search-field__clear"
          aria-label="Clear asset search"
          onClick={() => onChange("")}
        >
          ×
        </button>
      )}
    </div>
  );
}
