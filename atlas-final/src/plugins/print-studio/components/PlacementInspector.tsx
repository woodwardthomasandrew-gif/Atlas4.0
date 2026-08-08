import { Button, Input } from "@ui/components";
import type { CardPlacement } from "../schema";
import "./PlacementInspector.css";

export interface PlacementInspectorProps {
  placement: CardPlacement;
  onChange: (placement: CardPlacement) => void;
  onRemove: () => void;
  onBringToFront: () => void;
}

export function PlacementInspector({
  placement,
  onChange,
  onRemove,
  onBringToFront
}: PlacementInspectorProps): JSX.Element {
  const update = <K extends keyof CardPlacement>(key: K, value: CardPlacement[K]): void => {
    onChange({ ...placement, [key]: value });
  };

  return (
    <div className="placement-inspector">
      <h3>{placement.name}</h3>
      <div className="placement-inspector__row">
        <label>
          <span>X (in)</span>
          <Input
            type="number"
            step="any"
            value={placement.xIn}
            onChange={(e) => update("xIn", Number(e.target.value))}
          />
        </label>
        <label>
          <span>Y (in)</span>
          <Input
            type="number"
            step="any"
            value={placement.yIn}
            onChange={(e) => update("yIn", Number(e.target.value))}
          />
        </label>
      </div>
      <div className="placement-inspector__row">
        <label>
          <span>Width (in)</span>
          <Input
            type="number"
            step="any"
            min={0.25}
            value={placement.widthIn}
            onChange={(e) => update("widthIn", Number(e.target.value))}
          />
        </label>
        <label>
          <span>Height (in)</span>
          <Input
            type="number"
            step="any"
            min={0.25}
            value={placement.heightIn}
            onChange={(e) => update("heightIn", Number(e.target.value))}
          />
        </label>
      </div>
      <label className="placement-inspector__rotation">
        <span>Rotation (deg)</span>
        <Input
          type="number"
          step={5}
          value={placement.rotationDeg}
          onChange={(e) => update("rotationDeg", Number(e.target.value))}
        />
      </label>

      <div className="placement-inspector__actions">
        <Button variant="secondary" onClick={onBringToFront}>
          Bring to Front
        </Button>
        <Button variant="danger" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}
