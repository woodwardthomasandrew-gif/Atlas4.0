import { useEffect, useMemo, useRef, useState } from "react";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { listComponents, type ComponentRecord } from "@app/db/componentStore";
import { filterAssetsByName } from "@app/search/assetSearch";
import { getAllAssetTypes } from "@app/registry/assetRegistry";
import { AssetSearchField } from "@plugins/shared/components/AssetSearchField";
import { renderComponentCard } from "@plugins/trait/cardRenderer";
import "./CardLibrary.css";

export const DRAG_MIME_TYPE = "application/x-atlas-card";
const CATEGORY_STATE_KEY = "atlas.print-shop.category-expansion";

type CategoryExpansionState = Record<string, boolean>;

function readCategoryExpansionState(): CategoryExpansionState {
  try {
    const stored = sessionStorage.getItem(CATEGORY_STATE_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean")
    );
  } catch {
    return {};
  }
}

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
  sourceKind?: "asset" | "component";
  componentType?: string;
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
  const [query, setQuery] = useState("");
  const [expandedByType, setExpandedByType] = useState<CategoryExpansionState>(
    readCategoryExpansionState
  );
  const [traitComponents, setTraitComponents] = useState<ComponentRecord[]>([]);

  const placeableTypes = getAllAssetTypes().filter((d) => d.renderCardToCanvas && d.cardSize);

  useEffect(() => {
    let cancelled = false;
    Promise.all(placeableTypes.map((d) => listAssets(d.type).then((rows) => [d.type, rows] as const))).then(
      (pairs) => {
        if (cancelled) return;
        setRecordsByType(Object.fromEntries(pairs));
      }
    );
    listComponents("trait").then(setTraitComponents);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(CATEGORY_STATE_KEY, JSON.stringify(expandedByType));
    } catch {
      // Category expansion is only a convenience; storage may be unavailable.
    }
  }, [expandedByType]);

  const filteredRecordsByType = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(recordsByType).map(([type, records]) => [type, filterAssetsByName(records, query)])
      ),
    [recordsByType, query]
  );
  const filteredTraits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return traitComponents;
    return traitComponents.filter((trait) => trait.name.toLowerCase().includes(q) || trait.description.toLowerCase().includes(q) || trait.tags.some((tag) => tag.toLowerCase().includes(q)));
  }, [traitComponents, query]);
  const totalFilteredRecords = Object.values(filteredRecordsByType).reduce(
    (count, records) => count + records.length,
    0
  );
  const totalFilteredCards = totalFilteredRecords + filteredTraits.length;

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

  const handleTraitDragStart = (e: React.DragEvent<HTMLDivElement>, component: ComponentRecord): void => {
    const canvas = document.createElement("canvas");
    renderComponentThumbnail(canvas, component);
    const widthIn = 3.5;
    e.dataTransfer.setData(DRAG_MIME_TYPE, JSON.stringify({ kind: "new", assetType: "component", assetId: component.id, name: component.name, pages: [{ cardPageIndex: 0, widthIn, heightIn: widthIn * (canvas.height / canvas.width) }], sourceKind: "component", componentType: component.componentType } satisfies DraggedCardPayload));
    e.dataTransfer.effectAllowed = "copy";
  };

  if (placeableTypes.length === 0 && traitComponents.length === 0) {
    return <p className="card-library__note">No card-producing plugins are installed yet.</p>;
  }

  return (
    <div className="card-library">
      <AssetSearchField value={query} onChange={setQuery} />
      {query.trim().length > 0 && totalFilteredCards === 0 && (
        <p className="card-library__note">No matching cards found. Try a different search or clear the search.</p>
      )}
      {placeableTypes.map((definition) => {
        const allRecords = recordsByType[definition.type] ?? [];
        const records = filteredRecordsByType[definition.type] ?? [];
        if (query.trim().length > 0 && records.length === 0) return null;
        const searchActive = query.trim().length > 0;
        const expanded = searchActive || expandedByType[definition.type] !== false;
        return (
          <div key={definition.type} className="card-library__group">
            <button
              type="button"
              className="card-library__category-toggle"
              aria-expanded={expanded}
              onClick={() =>
                setExpandedByType((current) => ({ ...current, [definition.type]: !expanded }))
              }
            >
              <span className="card-library__category-chevron" aria-hidden="true">
                {expanded ? "▼" : "▶"}
              </span>
              <span>{definition.pluralLabel}</span>
              <span className="card-library__category-count">({allRecords.length})</span>
            </button>
            {expanded && (
              <>
                {allRecords.length === 0 && (
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
              </>
            )}
          </div>
        );
      })}
      <div className="card-library__group">
        {(() => {
          const expanded = query.trim().length > 0 || expandedByType["component:trait"] !== false;
          const traits = query.trim() ? filteredTraits : traitComponents;
          return <>
            <button type="button" className="card-library__category-toggle" aria-expanded={expanded} onClick={() => setExpandedByType((current) => ({ ...current, "component:trait": !expanded }))}><span className="card-library__category-chevron">{expanded ? "▼" : "▶"}</span><span>Traits</span><span className="card-library__category-count">({traitComponents.length})</span></button>
            {expanded && (traits.length === 0 ? <p className="card-library__note">No saved traits.</p> : <div className="card-library__grid">{traits.map((component) => <div key={component.id} className="card-library__item" draggable onDragStart={(e) => handleTraitDragStart(e, component)} title={`${component.name} (${component.isBuiltin ? "Built-in" : "Custom"})`}><ComponentThumbnail component={component} /><span className="card-library__item-name">{component.name}</span></div>)}</div>)}
          </>;
        })()}
      </div>
    </div>
  );
}

function renderComponentThumbnail(canvas: HTMLCanvasElement, component: ComponentRecord): void {
  // Local import keeps CardLibrary's existing asset flow unchanged while sharing the same renderer.
  const definitionCanvas = canvas;
  renderComponentCard(definitionCanvas, component);
}

function ComponentThumbnail({ component }: { component: ComponentRecord }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (canvasRef.current) renderComponentThumbnail(canvasRef.current, component); }, [component]);
  return <canvas ref={canvasRef} className="card-library__thumb-canvas" />;
}
