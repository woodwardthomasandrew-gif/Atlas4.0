import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listAssets, type AssetRecord } from "@app/db/assetStore";
import { shortcutDefinitions } from "@app/shortcuts/shortcutRegistry";
import { getNavItems } from "@app/navigation/navRegistry";
import { useShortcutContext } from "@app/shortcuts/ShortcutProvider";
import { search } from "@app/search/searchRegistry";
import "./CommandPalette.css";

interface PaletteItem { id: string; title: string; subtitle?: string; onSelect: () => void; }
export function CommandPalette({ initialQuery, onClose }: { initialQuery: string | null; onClose: () => void }): JSX.Element | null {
  const navigate = useNavigate();
  const { run } = useShortcutContext();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [providerItems, setProviderItems] = useState<PaletteItem[]>([]);
  const [selected, setSelected] = useState(0);
  useEffect(() => { if (initialQuery !== null) { setQuery(initialQuery); setSelected(0); void listAssets().then(setAssets); } }, [initialQuery]);
  useEffect(() => { if (initialQuery !== null && query.trim()) void search(query).then((results) => setProviderItems(results.map((result) => ({ id: result.id, title: result.title, subtitle: result.subtitle ?? result.assetType, onSelect: result.onSelect })))); else setProviderItems([]); }, [initialQuery, query]);
  const items = useMemo<PaletteItem[]>(() => {
    const term = query.trim().toLowerCase();
    const actions = shortcutDefinitions.filter((item) => item.id !== "close-overlay" && `${item.label} ${item.keys}`.toLowerCase().includes(term)).map((item) => ({ id: item.id, title: item.label, subtitle: item.keys, onSelect: () => { onClose(); run(item.id); } }));
    const assetItems = assets.filter((asset) => !term || asset.name.toLowerCase().includes(term)).map((asset) => ({ id: asset.id, title: asset.name || "Untitled asset", subtitle: asset.type, onSelect: () => { onClose(); const path = getNavItems().find((item) => item.path.includes(asset.type))?.path; if (path) navigate(`${path}/${asset.id}`); } }));
    return [...actions, ...providerItems, ...assetItems];
  }, [assets, navigate, onClose, providerItems, query, run]);
  useEffect(() => { if (initialQuery === null) return; const onKeyDown = (event: KeyboardEvent): void => { if (event.key === "ArrowDown") { event.preventDefault(); setSelected((value) => Math.min(value + 1, Math.max(0, items.length - 1))); } else if (event.key === "ArrowUp") { event.preventDefault(); setSelected((value) => Math.max(0, value - 1)); } else if (event.key === "Enter" && items[selected]) { event.preventDefault(); items[selected].onSelect(); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [initialQuery, items, selected]);
  if (initialQuery === null) return null;
  return <div className="atlas-command-palette__backdrop" onMouseDown={onClose}><div className="atlas-command-palette" role="dialog" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSelected(0); }} placeholder="Search Atlas actions and assets…" aria-label="Search Atlas" />{items.length ? <ul>{items.map((item, index) => <li key={`${item.id}-${index}`} className={index === selected ? "is-selected" : ""}><button type="button" onClick={item.onSelect}><span>{item.title}</span><small>{item.subtitle}</small></button></li>)}</ul> : <p>No matching actions or assets.</p>}</div></div>;
}
