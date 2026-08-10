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
  const [renderSize, setRenderSize] = useState<{ width: number; height: number } | null>(null);
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
    if (!record || !canvasRef.current) return;
    const pageIndex = placement.cardPageIndex ?? 0;

    let sourceCanvas: HTMLCanvasElement | null = null;
    if (definition?.renderCardToCanvases) {
      sourceCanvas = definition.renderCardToCanvases(record.name, record.data)[pageIndex] ?? null;
    } else if (definition?.renderCardToCanvas) {
      sourceCanvas = document.createElement("canvas");
      definition.renderCardToCanvas(sourceCanvas, record.name, record.data);
    }
    if (!sourceCanvas) return;

    const target = canvasRef.current;
    target.width = sourceCanvas.width;
    target.height = sourceCanvas.height;
    const ctx = target.getContext("2d");
    ctx?.drawImage(sourceCanvas, 0, 0);
    setRenderSize({ width: sourceCanvas.width, height: sourceCanvas.height });
  }, [definition, record, placement.cardPageIndex]);

  // Scale the canvas to *fit inside* the placement box, preserving its
  // real aspect ratio, instead of stretching it to fill the box (which is
  // what previously squashed tall stat blocks). Any leftover space is
  // letterboxed rather than hidden.
  const boxWidthPx = placement.widthIn * pxPerIn;
  const boxHeightPx = placement.heightIn * pxPerIn;
  let fitWidthPx = boxWidthPx;
  let fitHeightPx = boxHeightPx;
  if (renderSize && renderSize.width > 0 && renderSize.height > 0) {
    const scale = Math.min(boxWidthPx / renderSize.width, boxHeightPx / renderSize.height);
    fitWidthPx = renderSize.width * scale;
    fitHeightPx = renderSize.height * scale;
  }

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
      <canvas
        ref={canvasRef}
        className="placed-card__canvas"
        style={{ width: `${fitWidthPx}px`, height: `${fitHeightPx}px` }}
      />
    </div>
  );
}
