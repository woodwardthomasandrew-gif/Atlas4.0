import { useEffect, useRef, useState } from "react";
import {
  type CardPlacement,
  type MultiCardColumns,
  type PageSize,
  type PageOrientation,
  type PrintPage,
  getPageDimensionsIn
} from "../schema";
import { DRAG_MIME_TYPE, type DraggedCardPayload } from "./CardLibrary";
import { PlacedCard, MIN_SIZE_IN, type MoveDragPayload, type ResizeState } from "./PlacedCard";
import "./PageSurface.css";

/** Screen pixels per inch while editing. Export uses its own, higher-resolution DPI. */
const EDIT_PX_PER_IN = 72;

export interface PageSurfaceProps {
  page: PrintPage;
  pageSize: PageSize;
  orientation: PageOrientation;
  multiCardColumns: MultiCardColumns;
  zoom: number;
  showGrid: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChangePlacements: (placements: CardPlacement[]) => void;
}

export function PageSurface({
  page,
  pageSize,
  orientation,
  multiCardColumns,
  zoom,
  showGrid,
  selectedId,
  onSelect,
  onChangePlacements
}: PageSurfaceProps): JSX.Element {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dims = getPageDimensionsIn(pageSize, orientation);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const placementsRef = useRef(page.placements);
  placementsRef.current = page.placements;

  useEffect(() => {
    if (!resizeState) return;

    const handleMouseMove = (e: MouseEvent): void => {
      const dxIn = (e.clientX - resizeState.pointerStartXPx) / (EDIT_PX_PER_IN * zoom);
      const dyIn = (e.clientY - resizeState.pointerStartYPx) / (EDIT_PX_PER_IN * zoom);
      const unconstrained = e.shiftKey;

      let { startXIn, startYIn, startWidthIn, startHeightIn, aspectRatio, corner } = resizeState;

      // Determine raw new width/height from pointer movement, depending on
      // which corner is being dragged; the opposite edge stays anchored.
      let newWidthIn = startWidthIn;
      let newHeightIn = startHeightIn;

      const east = corner === "ne" || corner === "se";
      const south = corner === "sw" || corner === "se";

      if (east) {
        newWidthIn = startWidthIn + dxIn;
      } else {
        newWidthIn = startWidthIn - dxIn;
      }

      if (south) {
        newHeightIn = startHeightIn + dyIn;
      } else {
        newHeightIn = startHeightIn - dyIn;
      }

      newWidthIn = Math.max(MIN_SIZE_IN, newWidthIn);
      newHeightIn = Math.max(MIN_SIZE_IN, newHeightIn);

      if (!unconstrained) {
        // Preserve aspect ratio: pick the dominant axis of movement to drive sizing.
        if (Math.abs(dxIn) >= Math.abs(dyIn)) {
          newHeightIn = newWidthIn / aspectRatio;
        } else {
          newWidthIn = newHeightIn * aspectRatio;
        }
        newWidthIn = Math.max(MIN_SIZE_IN, newWidthIn);
        newHeightIn = Math.max(MIN_SIZE_IN, newHeightIn);
      }

      const xIn = east ? startXIn : startXIn + startWidthIn - newWidthIn;
      const yIn = south ? startYIn : startYIn + startHeightIn - newHeightIn;

      const clampedXIn = clamp(xIn, 0, Math.max(0, dims.widthIn - newWidthIn));
      const clampedYIn = clamp(yIn, 0, Math.max(0, dims.heightIn - newHeightIn));

      const next = placementsRef.current.map((p) =>
        p.id === resizeState.placementId
          ? { ...p, xIn: clampedXIn, yIn: clampedYIn, widthIn: newWidthIn, heightIn: newHeightIn }
          : p
      );
      onChangePlacements(next);
    };

    const handleMouseUp = (): void => {
      setResizeState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeState, dims.widthIn, dims.heightIn]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(DRAG_MIME_TYPE);
    if (!raw || !surfaceRef.current) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    const dropXIn = (e.clientX - rect.left) / (EDIT_PX_PER_IN * zoom);
    const dropYIn = (e.clientY - rect.top) / (EDIT_PX_PER_IN * zoom);

    const payload = JSON.parse(raw) as DraggedCardPayload | MoveDragPayload;

    if (payload.kind === "move") {
      const next = page.placements.map((p) =>
        p.id === payload.placementId
          ? {
              ...p,
              xIn: clamp(dropXIn - payload.grabOffsetXIn, 0, dims.widthIn - p.widthIn),
              yIn: clamp(dropYIn - payload.grabOffsetYIn, 0, dims.heightIn - p.heightIn)
            }
          : p
      );
      onChangePlacements(next);
      return;
    }

    if (payload.kind !== "new") return;

    // Multi-page assets (e.g. a creature whose stat block spans several
    // panels) can be arranged as a grid. Panels are scaled together so the
    // requested number of columns fits the physical page width.
    const GAP_IN = 0.25;
    const newPlacements: CardPlacement[] = [];
    const columns = Math.max(1, Math.min(multiCardColumns, payload.pages.length));
    const cellWidthIn = (dims.widthIn - GAP_IN * (columns - 1)) / columns;
    const gridWidthIn = cellWidthIn * columns + GAP_IN * (columns - 1);
    const gridXIn = clamp(dropXIn - gridWidthIn / 2, 0, Math.max(0, dims.widthIn - gridWidthIn));
    const scale = Math.min(1, cellWidthIn / Math.max(...payload.pages.map((page_) => page_.widthIn)));
    const panelWidths = payload.pages.map((page_) => page_.widthIn * scale);
    const panelHeights = payload.pages.map((page_) => page_.heightIn * scale);
    const rowHeights: number[] = [];
    for (let index = 0; index < payload.pages.length; index += columns) {
      rowHeights.push(Math.max(...panelHeights.slice(index, index + columns)));
    }
    const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0) + GAP_IN * (rowHeights.length - 1);
    const stackYIn = clamp(dropYIn - totalHeight / 2, 0, Math.max(0, dims.heightIn - totalHeight));

    for (let index = 0; index < payload.pages.length; index += 1) {
      const page_ = payload.pages[index];
      const column = index % columns;
      const row = Math.floor(index / columns);
      const rowOffset = rowHeights.slice(0, row).reduce((sum, height) => sum + height + GAP_IN, 0);
      const widthIn = panelWidths[index];
      const heightIn = panelHeights[index];
      const cellXIn = gridXIn + column * (cellWidthIn + GAP_IN);
      const xIn = cellXIn + (cellWidthIn - widthIn) / 2;
      const yIn = stackYIn + rowOffset;
      newPlacements.push({
        id: crypto.randomUUID(),
        assetType: payload.assetType,
        assetId: payload.assetId,
        name: payload.name,
        xIn: clamp(xIn, 0, Math.max(0, dims.widthIn - widthIn)),
        yIn: clamp(yIn, 0, Math.max(0, dims.heightIn - heightIn)),
        widthIn,
        heightIn,
        rotationDeg: 0,
        cardPageIndex: page_.cardPageIndex,
        sourceKind: payload.sourceKind,
        componentType: payload.componentType
      });
    }

    onChangePlacements([...page.placements, ...newPlacements]);
    onSelect(newPlacements[newPlacements.length - 1]?.id ?? null);
  };

  return (
    <div
      className="page-surface-viewport"
      style={{
        width: `${dims.widthIn * EDIT_PX_PER_IN * zoom}px`,
        height: `${dims.heightIn * EDIT_PX_PER_IN * zoom}px`
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => onSelect(null)}
    >
      <div
        ref={surfaceRef}
        className="page-surface"
        style={{
          width: `${dims.widthIn * EDIT_PX_PER_IN}px`,
          height: `${dims.heightIn * EDIT_PX_PER_IN}px`,
          transform: `scale(${zoom})`
        }}
      >
        {showGrid && <div className="page-surface__grid" aria-hidden="true" />}
        {page.placements.map((placement) => (
          <PlacedCard
            key={placement.id}
            placement={placement}
            pxPerIn={EDIT_PX_PER_IN}
            zoom={zoom}
            selected={placement.id === selectedId}
            onSelect={() => onSelect(placement.id)}
            onResizeStart={setResizeState}
          />
        ))}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export { EDIT_PX_PER_IN };
