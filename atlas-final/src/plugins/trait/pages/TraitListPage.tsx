import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Input } from "@ui/components";
import { duplicateComponent, listComponents, deleteCustomComponent, type ComponentRecord } from "@app/db/componentStore";
import { getComponentType } from "@app/registry/componentTypeRegistry";
import { TRAIT_STUDIO_TYPES, TRAIT_STUDIO_PATH, type TraitStudioType } from "../schema";
import "./TraitListPage.css";

type Source = "all" | "builtin" | "custom";
type Sort = "name" | "category" | "modified";

export function TraitListPage(): JSX.Element {
  const [items, setItems] = useState<ComponentRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | TraitStudioType>("all");
  const [source, setSource] = useState<Source>("all");
  const [sort, setSort] = useState<Sort>("name");
  const [descending, setDescending] = useState(false);
  const load = (): void => { listComponents().then((rows) => setItems(rows.filter((row) => TRAIT_STUDIO_TYPES.includes(row.componentType as TraitStudioType)))); };
  useEffect(load, []);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = (items ?? []).filter((row) => (type === "all" || row.componentType === type) && (source === "all" || (source === "builtin" ? row.isBuiltin : !row.isBuiltin)) && (!q || row.name.toLowerCase().includes(q) || row.description.toLowerCase().includes(q) || row.tags.some((tag) => tag.toLowerCase().includes(q))));
    rows.sort((a, b) => { const av = sort === "name" ? a.name : sort === "category" ? (getComponentType(a.componentType)?.label ?? a.componentType) : a.updatedAt; const bv = sort === "name" ? b.name : sort === "category" ? (getComponentType(b.componentType)?.label ?? b.componentType) : b.updatedAt; return av.localeCompare(bv); });
    return descending ? rows.reverse() : rows;
  }, [items, query, type, source, sort, descending]);
  const duplicate = async (id: string): Promise<void> => { await duplicateComponent(id); load(); };
  const remove = async (item: ComponentRecord): Promise<void> => { if (item.isBuiltin || !window.confirm(`Delete “${item.name}”?`)) return; await deleteCustomComponent(item.id); load(); };

  return <div className="trait-list"><header className="trait-list__header"><div><p className="trait-list__kicker">Reusable mechanical library</p><h1>Trait Studio</h1></div><Link to={`${TRAIT_STUDIO_PATH}/new`}><Button variant="primary">New Component</Button></Link></header>
    <div className="trait-list__controls"><Input placeholder="Search name, description, or tags…" value={query} onChange={(e) => setQuery(e.target.value)} /><select value={type} onChange={(e) => setType(e.target.value as typeof type)}><option value="all">All categories</option>{TRAIT_STUDIO_TYPES.map((id) => <option key={id} value={id}>{getComponentType(id)?.label ?? id}</option>)}</select><select value={source} onChange={(e) => setSource(e.target.value as Source)}><option value="all">All sources</option><option value="builtin">Built-in</option><option value="custom">Custom</option></select><select value={sort} onChange={(e) => setSort(e.target.value as Sort)}><option value="name">Sort: Name</option><option value="category">Sort: Category</option><option value="modified">Sort: Recently modified</option></select><Button variant="secondary" onClick={() => setDescending((value) => !value)}>{descending ? "Descending" : "Ascending"}</Button></div>
    {items === null && <p>Loading…</p>}{items !== null && visible.length === 0 && <EmptyState title="No components found" description="Try another filter or create a new reusable component." />}
    <div className="trait-list__grid">{visible.map((item) => <Card key={item.id} className="trait-list__card"><div className="trait-list__card-heading"><Link to={`${TRAIT_STUDIO_PATH}/${item.id}`}><strong>{item.name}</strong></Link><Badge className={item.isBuiltin ? "" : "trait-list__custom"}>{item.isBuiltin ? "Built-in" : "Custom"}</Badge></div><span className="trait-list__category">{getComponentType(item.componentType)?.label ?? item.componentType}</span>{item.description && <p>{item.description}</p>}{item.tags.length > 0 && <div className="trait-list__tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}<div className="trait-list__actions"><Button variant="ghost" onClick={() => void duplicate(item.id)}>Duplicate</Button>{!item.isBuiltin && <Button variant="danger" onClick={() => void remove(item)}>Delete</Button>}</div></Card>)}</div>
  </div>;
}
