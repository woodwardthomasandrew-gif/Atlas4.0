import { useRef } from "react";
import { PAGE_DIMENSIONS_IN, type CardPlacement, type PageSize, type PrintPage } from "../schema";
import { DRAG_MIME_TYPE, type DraggedCardPayload } from "./CardLibrary";
import { PlacedCard, type MoveDragPayload } from "./PlacedCard";
import "./PageSurface.css";

/** Screen pixels per inch while editing. Export uses its own, higher-resolution DPI. */
const EDIT_PX_PER_IN = 72;

export interface PageSurfaceProps {
  page: PrintPage;
  pageSize: PageSize;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChangePlacements: (placements: CardPlacement[]) => void;
}

export function PageSurface({
  page,
  pageSize,
  selectedId,
  onSelect,
  onChangePlacements
}: PageSurfaceProps): JSX.Element {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dims = PAGE_DIMENSIONS_IN[pageSize];

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(DRAG_MIME_TYPE);
    if (!raw || !surfaceRef.current) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    const dropXIn = (e.clientX - rect.left) / EDIT_PX_PER_IN;
    const dropYIn = (e.clientY - rect.top) / EDIT_PX_PER_IN;

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
    // cards) drop as a vertical stack of separate placements, each sized
    // to its own page's real content instead of one guessed box.
    const GAP_IN = 0.25;
    const newPlacements: CardPlacement[] = [];
    let stackYIn = dropYIn - payload.pages[0].heightIn / 2;

    for (const page_ of payload.pages) {
      const xIn = clamp(dropXIn - page_.widthIn / 2, 0, Math.max(0, dims.widthIn - page_.widthIn));
      const yIn = clamp(stackYIn, 0, Math.max(0, dims.heightIn - page_.heightIn));
      newPlacements.push({
        id: crypto.randomUUID(),
        assetType: payload.assetType,
        assetId: payload.assetId,
        name: payload.name,
        xIn,
        yIn,
        widthIn: page_.widthIn,
        heightIn: page_.heightIn,
        rotationDeg: 0,
        cardPageIndex: page_.cardPageIndex
      });
      stackYIn = yIn + page_.heightIn + GAP_IN;
    }

    onChangePlacements([...page.placements, ...newPlacements]);
    onSelect(newPlacements[newPlacements.length - 1]?.id ?? null);
  };

  return (
    <div
      ref={surfaceRef}
      className="page-surface"
      style={{
        width: `${dims.widthIn * EDIT_PX_PER_IN}px`,
        height: `${dims.heightIn * EDIT_PX_PER_IN}px`
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => onSelect(null)}
    >
      {page.placements.map((placement) => (
        <PlacedCard
          key={placement.id}
          placement={placement}
          pxPerIn={EDIT_PX_PER_IN}
          selected={placement.id === selectedId}
          onSelect={() => onSelect(placement.id)}
        />
      ))}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export { EDIT_PX_PER_IN };
