import type { AssetPreviewProps } from "@app/plugin-api/types";
import type { PrintLayoutData } from "../schema";
import "./PrintStudioPreview.css";

export function PrintStudioPreview({ name, data }: AssetPreviewProps<PrintLayoutData>): JSX.Element {
  const totalCards = data.pages.reduce((sum, p) => sum + p.placements.length, 0);

  return (
    <div className="print-studio-preview">
      <h2 className="print-studio-preview__name">{name || "Unnamed Layout"}</h2>
      <p className="print-studio-preview__meta">
        {data.pageSize === "letter" ? "US Letter" : "A4"} · {data.pages.length} page
        {data.pages.length === 1 ? "" : "s"} · {totalCards} card{totalCards === 1 ? "" : "s"}
      </p>
    </div>
  );
}
