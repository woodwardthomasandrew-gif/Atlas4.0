import { useEffect, useRef, useState } from "react";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { getAllAssetTypes } from "@app/registry/assetRegistry";
import "./CardLibrary.css";

export const DRAG_MIME_TYPE = "application/x-atlas-card";

/** One physical card's real size, derived from its actual rendered content rather than a guessed default. */
export interface DraggedCardPage {
  cardPageIndex: number;
  widthIn: number;
  heightIn: number;
}

export interface DraggedCardPayload {
  kind: "new";
  assetType: string;
  assetId: string;
  name: string;
  /** One entry per physical card the asset renders to (usually 1; more for paginated content). */
  pages: DraggedCardPage[];
}

/**
 * Renders the asset (using the multi-card API when available) and measures
 * each resulting canvas's true aspect ratio, so placements match what will
 * actually be drawn instead of assuming every card matches the asset
 * type's default cardSize. `cardSize.widthIn` is kept as the target design
 * width; height is derived per-card from the real content.
 */
function measureCardPages(
  definition: ReturnType<typeof getAllAssetTypes>[number],
  record: AssetRecord
): DraggedCardPage[] {
  const widthIn = definition.cardSize?.widthIn ?? 5;

  if (definition.renderCardToCanvases) {
    const canvases = definition.renderCardToCanvases(record.name, record.data);
    if (canvases.length > 0) {
      return canvases.map((canvas, cardPageIndex) => ({
        cardPageIndex,
        widthIn,
        heightIn: canvas.width > 0 ? widthIn * (canvas.height / canvas.width) : definition.cardSize?.heightIn ?? 7
      }));
    }
  }

  if (definition.renderCardToCanvas) {
    const canvas = document.createElement("canvas");
    definition.renderCardToCanvas(canvas, record.name, record.data);
    if (canvas.width > 0) {
      return [{ cardPageIndex: 0, widthIn, heightIn: widthIn * (canvas.height / canvas.width) }];
    }
  }

  return [{ cardPageIndex: 0, widthIn, heightIn: definition.cardSize?.heightIn ?? 7 }];
}

function Thumbnail({ assetType, record }: { assetType: string; record: AssetRecord }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const definition = getAllAssetTypes().find((d) => d.type === assetType);

  useEffect(() => {
    if (!definition?.renderCardToCanvas || !canvasRef.current) return;
    definition.renderCardToCanvas(canvasRef.current, record.name, record.data);
  }, [definition, record]);

  return <canvas ref={canvasRef} className="card-library__thumb-canvas" />;
}

export function CardLibrary(): JSX.Element {
  const [recordsByType, setRecordsByType] = useState<Record<string, AssetRecord[]>>({});

  const placeableTypes = getAllAssetTypes().filter((d) => d.renderCardToCanvas && d.cardSize);

  useEffect(() => {
    let cancelled = false;
    Promise.all(placeableTypes.map((d) => listAssets(d.type).then((rows) => [d.type, rows] as const))).then(
      (pairs) => {
        if (cancelled) return;
        setRecordsByType(Object.fromEntries(pairs));
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    assetType: string,
    record: AssetRecord
  ): void => {
    const definition = placeableTypes.find((d) => d.type === assetType);
    if (!definition) return;

    const payload: DraggedCardPayload = {
      kind: "new",
      assetType,
      assetId: record.id,
      name: record.name,
      pages: measureCardPages(definition, record)
    };
    e.dataTransfer.setData(DRAG_MIME_TYPE, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  if (placeableTypes.length === 0) {
    return <p className="card-library__note">No card-producing plugins are installed yet.</p>;
  }

  return (
    <div className="card-library">
      {placeableTypes.map((definition) => {
        const records = recordsByType[definition.type] ?? [];
        return (
          <div key={definition.type} className="card-library__group">
            <h3>{definition.pluralLabel}</h3>
            {records.length === 0 && (
              <p className="card-library__note">No saved {definition.pluralLabel.toLowerCase()}.</p>
            )}
            <div className="card-library__grid">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="card-library__item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, definition.type, record)}
                  title={record.name}
                >
                  <Thumbnail assetType={definition.type} record={record} />
                  <span className="card-library__item-name">{record.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
