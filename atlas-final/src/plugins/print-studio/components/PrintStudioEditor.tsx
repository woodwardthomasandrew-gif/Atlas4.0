import { useRef, useState } from "react";
import type { AssetEditorProps } from "@app/plugin-api/types";
import { Button } from "@ui/components";
import {
  createPage,
  type CardPlacement,
  type MultiCardColumns,
  type PageSize,
  type PageOrientation,
  type PrintLayoutData,
  getPageDimensionsIn,
  PAGE_SIZE_LABELS,
  withPageSettings
} from "../schema";
import { CardLibrary } from "./CardLibrary";
import { PageSurface } from "./PageSurface";
import { PlacementInspector } from "./PlacementInspector";
import "./PrintStudioEditor.css";

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200];

export function PrintStudioEditor({ data, onChange }: AssetEditorProps<PrintLayoutData>): JSX.Element {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const canvasScrollRef = useRef<HTMLDivElement>(null);

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

  const changeZoom = (direction: -1 | 1): void => {
    if (direction < 0) {
      const previous = [...ZOOM_LEVELS].reverse().find((level) => level < zoom);
      setZoom(previous ?? ZOOM_LEVELS[0]);
    } else {
      const next = ZOOM_LEVELS.find((level) => level > zoom);
      setZoom(next ?? ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
    }
  };

  const fitToView = (): void => {
    const viewport = canvasScrollRef.current;
    if (!viewport) return;
    const dims = getPageDimensionsIn(data.pageSize, data.orientation);
    const availableWidth = Math.max(0, viewport.clientWidth - 24);
    const availableHeight = Math.max(0, viewport.clientHeight - 24);
    const fitPercent = Math.min(
      (availableWidth / (dims.widthIn * 72)) * 100,
      (availableHeight / (dims.heightIn * 72)) * 100
    );
    const fitLevel = ZOOM_LEVELS.filter((level) => level <= fitPercent).pop();
    setZoom(fitLevel ?? ZOOM_LEVELS[0]);
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    if (!e.ctrlKey || e.deltaY === 0) return;
    e.preventDefault();
    changeZoom(e.deltaY < 0 ? 1 : -1);
  };

  if (!activePage) return <p>No pages.</p>;

  return (
    <div className="print-studio-editor">
      <div className="print-studio-editor__toolbar">
        <label className="print-studio-editor__page-size">
          <span>Page Size</span>
          <select
            value={data.pageSize}
            onChange={(e) => onChange(withPageSettings(data, e.target.value as PageSize))}
          >
            {Object.entries(PAGE_SIZE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="print-studio-editor__page-size">
          <span>Orientation</span>
          <select
            value={data.orientation ?? "portrait"}
            onChange={(e) => onChange(withPageSettings(data, data.pageSize, e.target.value as PageOrientation))}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>

        <Button
          variant="secondary"
          aria-pressed={showGrid}
          onClick={() => setShowGrid((visible) => !visible)}
        >
          Grid: {showGrid ? "ON" : "OFF"}
        </Button>

        <div className="print-studio-editor__zoom-controls" aria-label="Canvas zoom controls">
          <Button variant="secondary" aria-label="Zoom out" onClick={() => changeZoom(-1)} disabled={zoom === 25}>
            −
          </Button>
          <span className="print-studio-editor__zoom-value">{zoom}%</span>
          <Button variant="secondary" aria-label="Zoom in" onClick={() => changeZoom(1)} disabled={zoom === 200}>
            +
          </Button>
          <Button variant="secondary" onClick={fitToView}>
            Fit to view
          </Button>
        </div>

        <label className="print-studio-editor__page-size">
          <span>Multi-panel columns</span>
          <select
            value={data.multiCardColumns ?? 1}
            onChange={(e) =>
              onChange({ ...data, multiCardColumns: Number(e.target.value) as MultiCardColumns })
            }
          >
            <option value={1}>1 (stack)</option>
            <option value={2}>2 columns</option>
            <option value={3}>3 columns</option>
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

        <div
          ref={canvasScrollRef}
          className="print-studio-editor__canvas-scroll"
          onWheel={handleCanvasWheel}
        >
          <PageSurface
            page={activePage}
            pageSize={data.pageSize}
            orientation={data.orientation ?? "portrait"}
            multiCardColumns={data.multiCardColumns ?? 1}
            zoom={zoom / 100}
            showGrid={showGrid}
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
