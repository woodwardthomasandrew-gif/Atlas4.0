import type { AssetPreviewProps } from "@app/plugin-api/types";
import { Badge } from "@ui/components";
import type { MagicItemData } from "../schema";
import { describeDamage, formatChargesLine, rarityClassName } from "../cardText";
import "./MagicItemPreview.css";

export function MagicItemPreview({ name, data }: AssetPreviewProps<MagicItemData>): JSX.Element {
  return (
    <div className={`magic-item-card ${rarityClassName(data.rarity)}`}>
      <div className="magic-item-card__frame">
        <header className="magic-item-card__header">
          <h2 className="magic-item-card__name">{name || "Unnamed Item"}</h2>
          <p className="magic-item-card__subtitle">
            {data.itemType || "Untitled item type"}
            {data.requiresAttunement ? " (requires attunement)" : ""}
          </p>
        </header>

        <div className="magic-item-card__meta">
          <Badge>{data.rarity}</Badge>
          {data.requiresAttunement && <Badge>Attunement</Badge>}
          {data.hasDamage && <Badge>{describeDamage(data.damage)}</Badge>}
          {data.hasCharges && <Badge>{formatChargesLine(data.charges)}</Badge>}
        </div>

        <div className="magic-item-card__stats">
          <span>{data.weightLb} lb</span>
          <span>{data.valueGp} gp</span>
        </div>

        {data.flavorText && (
          <p className="magic-item-card__flavor">{data.flavorText}</p>
        )}

        {data.mechanicalText && (
          <p className="magic-item-card__mechanics">{data.mechanicalText}</p>
        )}

        {data.hasCharges && (
          <div className="magic-item-card__section">
            <h3>Charges</h3>
            <p>{formatChargesLine(data.charges)}</p>
          </div>
        )}

        {data.hasDamage && (
          <div className="magic-item-card__section">
            <h3>Damage</h3>
            <p>{describeDamage(data.damage)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
