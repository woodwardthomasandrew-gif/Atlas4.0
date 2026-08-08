import { useEffect, useMemo, useState } from "react";
import { Badge, Modal } from "@ui/components";
import { searchComponents, type ComponentRecord } from "@app/db/componentStore";
import { getComponentType } from "@app/registry/componentTypeRegistry";
import "./ComponentLibraryPicker.css";

export interface ComponentLibraryPickerProps {
  /** Which component slot this picker is filling, e.g. "trait" or "action". */
  componentType: string;
  /** Called with the chosen library component. Caller is responsible for copying it in. */
  onInsert: (component: ComponentRecord) => void;
  onClose: () => void;
}

type SourceFilter = "all" | "builtin" | "custom";

/**
 * Search → Click → Insert. A single dialog: type to filter, click a result
 * to insert it immediately and close. No confirmation step, no nested
 * dialogs — the row itself shows enough of the component (name, source,
 * tags, description) to decide without opening anything else first.
 */
export function ComponentLibraryPicker({
  componentType,
  onInsert,
  onClose
}: ComponentLibraryPickerProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [results, setResults] = useState<ComponentRecord[] | null>(null);

  const typeDef = getComponentType(componentType);
  const title = typeDef ? `Add ${typeDef.label} from Library` : "Add from Library";

  useEffect(() => {
    let cancelled = false;
    searchComponents(componentType, query).then((rows) => {
      if (!cancelled) setResults(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [componentType, query]);

  const filtered = useMemo(() => {
    if (!results) return null;
    if (source === "all") return results;
    return results.filter((r) => (source === "builtin" ? r.isBuiltin : !r.isBuiltin));
  }, [results, source]);

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="component-library-picker">
        <div className="component-library-picker__controls">
          <input
            autoFocus
            className="component-library-picker__search"
            type="text"
            placeholder="Search by name, description, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="component-library-picker__filters">
            {(["all", "builtin", "custom"] as SourceFilter[]).map((option) => (
              <button
                key={option}
                type="button"
                className={`component-library-picker__filter ${
                  source === option ? "component-library-picker__filter--active" : ""
                }`}
                onClick={() => setSource(option)}
              >
                {option === "all" ? "All" : option === "builtin" ? "Built-in" : "Custom"}
              </button>
            ))}
          </div>
        </div>

        {filtered === null && <p className="component-library-picker__note">Loading…</p>}

        {filtered !== null && filtered.length === 0 && (
          <p className="component-library-picker__note">
            No components found. Try a different search, or create this one from scratch and save
            it to the library for next time.
          </p>
        )}

        {filtered !== null && filtered.length > 0 && (
          <ul className="component-library-picker__list">
            {filtered.map((component) => (
              <li key={component.id}>
                <button
                  type="button"
                  className="component-library-picker__item"
                  onClick={() => {
                    onInsert(component);
                    onClose();
                  }}
                >
                  <div className="component-library-picker__item-header">
                    <strong>{component.name}</strong>
                    <Badge className={component.isBuiltin ? "" : "component-library-picker__badge--custom"}>
                      {component.isBuiltin ? "Built-in" : "Custom"}
                    </Badge>
                  </div>
                  {component.description && (
                    <p className="component-library-picker__item-description">{component.description}</p>
                  )}
                  {component.tags.length > 0 && (
                    <div className="component-library-picker__item-tags">
                      {component.tags.map((tag) => (
                        <span key={tag} className="component-library-picker__tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
