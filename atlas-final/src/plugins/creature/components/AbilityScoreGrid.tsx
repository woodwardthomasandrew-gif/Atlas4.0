import { Input } from "@ui/components";
import { abilityModifier, formatModifier, type AbilityKey, type AbilityScores } from "../schema";
import "./AbilityScoreGrid.css";

const LABELS: Record<AbilityKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma"
};

export interface AbilityScoreGridProps {
  value: AbilityScores;
  onChange: (value: AbilityScores) => void;
}

export function AbilityScoreGrid({ value, onChange }: AbilityScoreGridProps): JSX.Element {
  const keys = Object.keys(LABELS) as AbilityKey[];

  return (
    <div className="ability-score-grid">
      {keys.map((key) => (
        <label key={key} className="ability-score-grid__field">
          <span>{LABELS[key]}</span>
          <Input
            type="number"
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) })}
          />
          <span className="ability-score-grid__modifier">
            {formatModifier(abilityModifier(value[key]))}
          </span>
        </label>
      ))}
    </div>
  );
}
