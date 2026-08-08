import { useState } from "react";
import type { AssetEditorProps } from "@app/plugin-api/types";
import { Button } from "@ui/components";
import { createPage, type CardPlacement, type PageSize, type PrintLayoutData } from "../schema";
import { CardLibrary } from "./CardLibrary";
import { PageSurface } from "./PageSurface";
import { PlacementInspector } from "./PlacementInspector";
import "./PrintStudioEditor.css";

export function PrintStudioEditor({ data, onChange }: AssetEditorProps<PrintLayoutData>): JSX.Element {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activePage = data.pages[activePageIndex] ?? data.pages[0];

  const updatePlacements = (placements: CardPlacement[]): void => {
    const nextPages = data.pages.map((p, i) => (i === activePageIndex ? { ...p, placements } : p));
    onChange({ ...data, pages: nextPages });
  };

  const addPage = (): void => {
    onChange({ ...data, pages: [...data.pages, createPage()] });
    setActivePageIndex(data.pages.length);
    setSelectedId(null);
  };

  const removePage = (index: number): void => {
    if (data.pages.length <= 1) return;
    const nextPages = data.pages.filter((_, i) => i !== index);
    onChange({ ...data, pages: nextPages });
    setActivePageIndex((current) => Math.min(current, nextPages.length - 1));
    setSelectedId(null);
  };

  const selectedPlacement = activePage?.placements.find((p) => p.id === selectedId) ?? null;

  const updateSelectedPlacement = (placement: CardPlacement): void => {
    updatePlacements(activePage.placements.map((p) => (p.id === placement.id ? placement : p)));
  };

  const removeSelectedPlacement = (): void => {
    if (!selectedPlacement) return;
    updatePlacements(activePage.placements.filter((p) => p.id !== selectedPlacement.id));
    setSelectedId(null);
  };

  const bringSelectedToFront = (): void => {
    if (!selectedPlacement) return;
    const rest = activePage.placements.filter((p) => p.id !== selectedPlacement.id);
    updatePlacements([...rest, selectedPlacement]);
  };

  if (!activePage) return <p>No pages.</p>;

  return (
    <div className="print-studio-editor">
      <div className="print-studio-editor__toolbar">
        <label className="print-studio-editor__page-size">
          <span>Page Size</span>
          <select
            value={data.pageSize}
            onChange={(e) => onChange({ ...data, pageSize: e.target.value as PageSize })}
          >
            <option value="letter">US Letter</option>
            <option value="a4">A4</option>
          </select>
        </label>

        <div className="print-studio-editor__page-tabs">
          {data.pages.map((page, index) => (
            <button
              key={page.id}
              type="button"
              className={`print-studio-editor__page-tab ${
                index === activePageIndex ? "print-studio-editor__page-tab--active" : ""
              }`}
              onClick={() => {
                setActivePageIndex(index);
                setSelectedId(null);
              }}
            >
              Page {index + 1}
              {data.pages.length > 1 && (
                <span
                  className="print-studio-editor__page-tab-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePage(index);
                  }}
                >
                  ×
                </span>
              )}
            </button>
          ))}
          <Button variant="secondary" onClick={addPage}>
            + Page
          </Button>
        </div>
      </div>

      <div className="print-studio-editor__workspace">
        <CardLibrary />

        <div className="print-studio-editor__canvas-scroll">
          <PageSurface
            page={activePage}
            pageSize={data.pageSize}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChangePlacements={updatePlacements}
          />
        </div>

        {selectedPlacement && (
          <PlacementInspector
            placement={selectedPlacement}
            onChange={updateSelectedPlacement}
            onRemove={removeSelectedPlacement}
            onBringToFront={bringSelectedToFront}
          />
        )}
      </div>
    </div>
  );
}
