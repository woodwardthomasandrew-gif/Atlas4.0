import { Input } from "@ui/components";
import type { SenseValue } from "../schema";
import "./SenseRow.css";

export interface SenseRowProps {
  label: string;
  value: SenseValue;
  onChange: (value: SenseValue) => void;
  /** Shown next to the label when auto is on and a calculated value is available (passive perception only). */
  calculatedValue?: number;
  /** Increment step for the numeric input, e.g. 5 for distance-based senses like darkvision. */
  step?: number;
}

export function SenseRow({ label, value, onChange, calculatedValue, step }: SenseRowProps): JSX.Element {
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
          step={step}
          min={step ? 0 : undefined}
          value={value.value}
          onChange={(e) => {
            const raw = Number(e.target.value);
            const snapped = step ? Math.max(0, Math.round(raw / step) * step) : raw;
            onChange({ ...value, value: snapped });
          }}
        />
      )}
      {value.auto && calculatedValue !== undefined && (
        <span className="sense-row__calculated">{calculatedValue}</span>
      )}
    </div>
  );
}
