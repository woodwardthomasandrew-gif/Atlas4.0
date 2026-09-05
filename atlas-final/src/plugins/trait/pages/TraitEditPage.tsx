import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card } from "@ui/components";
import { deleteCustomComponent, duplicateComponent, getComponent, saveCustomComponent, type ComponentRecord } from "@app/db/componentStore";
import { getComponentType } from "@app/registry/componentTypeRegistry";
import { draftFromComponent, createTraitDraft, TraitEditor, type TraitDraft } from "../components/TraitEditor";
import { TRAIT_STUDIO_PATH } from "../schema";
import "./TraitEditPage.css";

export function TraitEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [component, setComponent] = useState<ComponentRecord | null>(null);
  const [draft, setDraft] = useState<TraitDraft>(createTraitDraft);
  const [loaded, setLoaded] = useState(isNew);
  const [error, setError] = useState("");
  useEffect(() => { if (isNew) return; getComponent(id as string).then((row) => { if (row) { setComponent(row); setDraft(draftFromComponent(row)); } setLoaded(true); }); }, [id, isNew]);
  const save = async (): Promise<void> => { if (!draft.name.trim()) { setError("Name is required."); return; } if (component?.isBuiltin) return; await saveCustomComponent({ id: isNew ? undefined : component?.id, componentType: draft.componentType, name: draft.name.trim(), description: draft.description, tags: draft.tags, data: draft.data }); navigate(TRAIT_STUDIO_PATH); };
  const duplicate = async (): Promise<void> => { if (!component) return; const copy = await duplicateComponent(component.id); navigate(`${TRAIT_STUDIO_PATH}/${copy.id}`); };
  const remove = async (): Promise<void> => { if (!component || component.isBuiltin || !window.confirm(`Delete “${component.name}”?`)) return; await deleteCustomComponent(component.id); navigate(TRAIT_STUDIO_PATH); };
  if (!loaded) return <p>Loading…</p>;
  if (!isNew && !component) return <p>Component not found.</p>;
  const readOnly = component?.isBuiltin ?? false;
  return <div className="trait-edit"><header className="trait-edit__header"><div><p className="trait-edit__kicker">{isNew ? "New reusable component" : getComponentType(component!.componentType)?.label}</p><h1>{isNew ? "New Component" : component!.name}</h1></div><div className="trait-edit__actions">{component && <Button onClick={() => void duplicate()}>Duplicate</Button>}{component && !readOnly && <Button variant="danger" onClick={() => void remove()}>Delete</Button>}{!readOnly && <Button variant="primary" onClick={() => void save()}>Save</Button>}</div></header>{readOnly && <Card className="trait-edit__notice">Built-in component · Read-only</Card>}{error && <Card className="trait-edit__error">{error}</Card>}<TraitEditor value={draft} readOnly={readOnly} onChange={setDraft} /></div>;
}
