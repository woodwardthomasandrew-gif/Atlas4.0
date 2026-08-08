import { useState } from "react";
import "./TagSelect.css";

export interface TagSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  presets: string[];
  placeholder?: string;
}

const CUSTOM_OPTION = "__custom__";

export function TagSelect({ value, onChange, presets, placeholder }: TagSelectProps): JSX.Element {
  const [customText, setCustomText] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const addTag = (tag: string): void => {
    const trimmed = tag.trim();
    if (trimmed.length === 0) return;
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
  };

  const removeTag = (tag: string): void => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const selected = e.target.value;
    if (selected === CUSTOM_OPTION) {
      setShowCustomInput(true);
      return;
    }
    if (selected) {
      addTag(selected);
    }
    e.target.value = "";
  };

  const handleAddCustom = (): void => {
    addTag(customText);
    setCustomText("");
    setShowCustomInput(false);
  };

  return (
    <div className="tag-select">
      <div className="tag-select__chips">
        {value.map((tag) => (
          <span key={tag} className="tag-select__chip">
            {tag}
            <button
              type="button"
              className="tag-select__chip-remove"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="tag-select__controls">
        <select className="tag-select__select" defaultValue="" onChange={handleSelect}>
          <option value="" disabled>
            {placeholder ?? "Add..."}
          </option>
          {presets
            .filter((preset) => !value.includes(preset))
            .map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          <option value={CUSTOM_OPTION}>Custom...</option>
        </select>

        {showCustomInput && (
          <div className="tag-select__custom-row">
            <input
              className="tag-select__custom-input"
              value={customText}
              placeholder="Custom entry"
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
            />
            <button type="button" className="tag-select__custom-add" onClick={handleAddCustom}>
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
