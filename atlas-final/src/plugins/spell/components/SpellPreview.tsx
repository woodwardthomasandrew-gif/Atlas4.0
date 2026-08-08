import type { AssetPreviewProps } from "@app/plugin-api/types";
import { Badge } from "@ui/components";
import type { SpellData } from "../schema";
import {
  formatAreaOfEffect,
  formatComponentsLine,
  formatDamageHealingLine,
  formatLevelSchoolLine,
  formatResolutionLine
} from "../cardText";
import "./SpellPreview.css";

export function SpellPreview({ name, data }: AssetPreviewProps<SpellData>): JSX.Element {
  const resolutionLine = formatResolutionLine(data);
  const damageHealingLine = formatDamageHealingLine(data);
  const areaLine = formatAreaOfEffect(data.areaOfEffect);

  return (
    <div className="spell-card">
      {data.artworkDataUrl && (
        <img className="spell-card__artwork" src={data.artworkDataUrl} alt={name} />
      )}

      <header className="spell-card__header">
        <h2 className="spell-card__name">{name || "Unnamed Spell"}</h2>
        <p className="spell-card__subtitle">{formatLevelSchoolLine(data)}</p>
      </header>

      <div className="spell-card__meta">
        {data.concentration && <Badge>Concentration</Badge>}
        {data.ritual && <Badge>Ritual</Badge>}
        {resolutionLine && <Badge>{resolutionLine}</Badge>}
      </div>

      <div className="spell-card__divider" />

      <p>
        <strong>Casting Time</strong> {data.castingTime}
      </p>
      <p>
        <strong>Range</strong> {data.range}
      </p>
      <p>
        <strong>Components</strong> {formatComponentsLine(data.components)}
      </p>
      <p>
        <strong>Duration</strong> {data.duration}
      </p>

      <div className="spell-card__divider" />

      <p className="spell-card__description">{data.description}</p>

      {damageHealingLine && (
        <p>
          <strong>Effect</strong> {damageHealingLine}
        </p>
      )}
      {areaLine && (
        <p>
          <strong>Area</strong> {areaLine}
        </p>
      )}
      {data.conditionsApplied.length > 0 && (
        <p>
          <strong>Conditions</strong> {data.conditionsApplied.join(", ")}
        </p>
      )}

      {data.scaling.canUpcast && data.scaling.description && (
        <div className="spell-card__section">
          <h3>At Higher Levels</h3>
          <p>{data.scaling.description}</p>
        </div>
      )}

      {data.classes.length > 0 && (
        <p className="spell-card__classes">
          <em>{data.classes.join(", ")}</em>
        </p>
      )}
    </div>
  );
}
