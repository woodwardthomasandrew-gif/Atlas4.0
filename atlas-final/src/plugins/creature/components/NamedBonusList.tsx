import { Button, Input } from "@ui/components";
import type { NamedBonus } from "../schema";
import "./NamedBonusList.css";

export interface NamedBonusListProps {
  value: NamedBonus[];
  onChange: (value: NamedBonus[]) => void;
  namePlaceholder: string;
}

export function NamedBonusList({ value, onChange, namePlaceholder }: NamedBonusListProps): JSX.Element {
  const update = (index: number, patch: Partial<NamedBonus>): void => {
    const next = value.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const remove = (index: number): void => {
    onChange(value.filter((_, i) => i !== index));
  };

  const add = (): void => {
    onChange([...value, { name: "", bonus: 0 }]);
  };

  return (
    <div className="named-bonus-list">
      {value.map((entry, index) => (
        <div key={index} className="named-bonus-list__row">
          <Input
            className="named-bonus-list__name"
            placeholder={namePlaceholder}
            value={entry.name}
            onChange={(e) => update(index, { name: e.target.value })}
          />
          <Input
            className="named-bonus-list__bonus"
            type="number"
            value={entry.bonus}
            onChange={(e) => update(index, { bonus: Number(e.target.value) })}
          />
          <Button variant="ghost" onClick={() => remove(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={add}>
        Add {namePlaceholder}
      </Button>
    </div>
  );
}
