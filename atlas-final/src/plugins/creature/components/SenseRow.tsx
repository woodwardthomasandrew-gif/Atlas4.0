import { Input } from "@ui/components";
import type { SenseValue } from "../schema";
import "./SenseRow.css";

export interface SenseRowProps {
  label: string;
  value: SenseValue;
  onChange: (value: SenseValue) => void;
  /** Shown next to the label when auto is on and a calculated value is available (passive perception only). */
  calculatedValue?: number;
}

export function SenseRow({ label, value, onChange, calculatedValue }: SenseRowProps): JSX.Element {
  return (
    <div className="sense-row">
      <span className="sense-row__label">{label}</span>
      <label className="sense-row__auto">
        <input
          type="checkbox"
          checked={value.auto}
          onChange={(e) => onChange({ ...value, auto: e.target.checked })}
        />
        <span>{calculatedValue !== undefined ? "Auto-calculate" : "None"}</span>
      </label>
      {!value.auto && (
        <Input
          type="number"
          className="sense-row__value"
          value={value.value}
          onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
        />
      )}
      {value.auto && calculatedValue !== undefined && (
        <span className="sense-row__calculated">{calculatedValue}</span>
      )}
    </div>
  );
}
