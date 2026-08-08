import { useState } from "react";
import "./ChipInput.css";

export interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function ChipInput({ value, onChange, placeholder }: ChipInputProps): JSX.Element {
  const [text, setText] = useState("");

  const add = (): void => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    onChange([...value, trimmed]);
    setText("");
  };

  const remove = (index: number): void => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="chip-input">
      <div className="chip-input__chips">
        {value.map((chip, index) => (
          <span key={`${chip}-${index}`} className="chip-input__chip">
            {chip}
            <button
              type="button"
              className="chip-input__chip-remove"
              onClick={() => remove(index)}
              aria-label={`Remove ${chip}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="chip-input__row">
        <input
          className="chip-input__text"
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="chip-input__add" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}
