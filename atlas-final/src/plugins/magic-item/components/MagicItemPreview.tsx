import type { AssetPreviewProps } from "@app/plugin-api/types";
import { Badge } from "@ui/components";
import type { MagicItemData } from "../schema";
import "./MagicItemPreview.css";

export function MagicItemPreview({ data }: AssetPreviewProps<MagicItemData>): JSX.Element {
  return (
    <div className="magic-item-preview">
      <div className="magic-item-preview__meta">
        <Badge>{data.rarity || "unset"}</Badge>
        {data.requiresAttunement && <Badge>Attunement</Badge>}
      </div>
      <p className="magic-item-preview__type">{data.itemType || "Untitled item type"}</p>
      <p className="magic-item-preview__description">
        {data.description || "No description yet."}
      </p>
    </div>
  );
}
