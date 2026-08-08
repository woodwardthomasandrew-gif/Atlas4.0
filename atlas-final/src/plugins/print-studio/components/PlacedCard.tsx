import { useEffect, useRef, useState } from "react";
import { getAsset } from "@app/db/assetStore";
import { getAllAssetTypes } from "@app/registry/assetRegistry";
import type { CardPlacement } from "../schema";
import { DRAG_MIME_TYPE } from "./CardLibrary";
import "./PlacedCard.css";

export interface MoveDragPayload {
  kind: "move";
  placementId: string;
  grabOffsetXIn: number;
  grabOffsetYIn: number;
}

export interface PlacedCardProps {
  placement: CardPlacement;
  pxPerIn: number;
  selected: boolean;
  onSelect: () => void;
}

export function PlacedCard({ placement, pxPerIn, selected, onSelect }: PlacedCardProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [record, setRecord] = useState<{ name: string; data: unknown } | null>(null);
  const definition = getAllAssetTypes().find((d) => d.type === placement.assetType);

  useEffect(() => {
    let cancelled = false;
    getAsset(placement.assetId).then((row) => {
      if (!cancelled && row) setRecord({ name: row.name, data: row.data });
    });
    return () => {
      cancelled = true;
    };
  }, [placement.assetId]);

  useEffect(() => {
    if (!definition?.renderCardToCanvas || !canvasRef.current || !record) return;
    definition.renderCardToCanvas(canvasRef.current, record.name, record.data);
  }, [definition, record]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const grabOffsetXIn = (e.clientX - rect.left) / pxPerIn;
    const grabOffsetYIn = (e.clientY - rect.top) / pxPerIn;
    const payload: MoveDragPayload = {
      kind: "move",
      placementId: placement.id,
      grabOffsetXIn,
      grabOffsetYIn
    };
    e.dataTransfer.setData(DRAG_MIME_TYPE, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`placed-card ${selected ? "placed-card--selected" : ""}`}
      style={{
        left: `${placement.xIn * pxPerIn}px`,
        top: `${placement.yIn * pxPerIn}px`,
        width: `${placement.widthIn * pxPerIn}px`,
        height: `${placement.heightIn * pxPerIn}px`,
        transform: `rotate(${placement.rotationDeg}deg)`
      }}
      draggable
      onDragStart={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <canvas ref={canvasRef} className="placed-card__canvas" />
    </div>
  );
}
