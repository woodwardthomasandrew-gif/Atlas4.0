import { useEffect, useRef, useState } from "react";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { getAllAssetTypes } from "@app/registry/assetRegistry";
import "./CardLibrary.css";

export const DRAG_MIME_TYPE = "application/x-atlas-card";

export interface DraggedCardPayload {
  kind: "new";
  assetType: string;
  assetId: string;
  name: string;
  widthIn: number;
  heightIn: number;
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
    record: AssetRecord,
    cardSize: { widthIn: number; heightIn: number }
  ): void => {
    const payload: DraggedCardPayload = {
      kind: "new",
      assetType,
      assetId: record.id,
      name: record.name,
      widthIn: cardSize.widthIn,
      heightIn: cardSize.heightIn
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
                  onDragStart={(e) =>
                    handleDragStart(e, definition.type, record, definition.cardSize!)
                  }
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
