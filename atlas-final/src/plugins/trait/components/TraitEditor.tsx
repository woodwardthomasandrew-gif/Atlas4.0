import { useMemo } from "react";
import { Button, Input } from "@ui/components";
import { DAMAGE_DIE_TYPES, DAMAGE_TYPES, createDefaultDamage } from "@plugins/shared/damage";
import { getComponentType } from "@app/registry/componentTypeRegistry";
import { emptyTraitMechanics, normalizeTraitMechanics, TRAIT_STUDIO_TYPES, type TraitStudioType } from "../schema";
import "./TraitEditor.css";

export interface TraitDraft {
  name: string;
  description: string;
  tags: string[];
  componentType: TraitStudioType;
  data: ReturnType<typeof emptyTraitMechanics>;
}

interface Props {
  value: TraitDraft;
  readOnly?: boolean;
  onChange: (value: TraitDraft) => void;
}

export function createTraitDraft(): TraitDraft {
  return { name: "", description: "", tags: [], componentType: "trait", data: emptyTraitMechanics() };
}

export function draftFromComponent(component: { name: string; description: string; tags: string[]; componentType: string; data: unknown }): TraitDraft {
  return {
    name: component.name,
    description: component.description,
    tags: [...component.tags],
    componentType: TRAIT_STUDIO_TYPES.includes(component.componentType as TraitStudioType)
      ? (component.componentType as TraitStudioType)
      : "trait",
    data: normalizeTraitMechanics(component.data)
  };
}

export function TraitEditor({ value, readOnly, onChange }: Props): JSX.Element {
  const hasStructuredData = useMemo(
    () => value.data.attackBonus !== null || value.data.saveDC !== null || value.data.extraAttacksCount !== null || value.data.damage !== null,
    [value.data]
  );
  const update = <K extends keyof TraitDraft>(key: K, next: TraitDraft[K]): void => onChange({ ...value, [key]: next });
  const updateData = (patch: Partial<TraitDraft["data"]>): void => update("data", { ...value.data, ...patch });

  return (
    <div className="trait-editor">
      <label><span>Name</span><Input disabled={readOnly} value={value.name} onChange={(e) => update("name", e.target.value)} /></label>
      <label><span>Category</span>
        <select disabled={readOnly} value={value.componentType} onChange={(e) => update("componentType", e.target.value as TraitStudioType)}>
          {TRAIT_STUDIO_TYPES.map((type) => <option key={type} value={type}>{getComponentType(type)?.label ?? type}</option>)}
        </select>
      </label>
      <label><span>Description</span><textarea disabled={readOnly} rows={6} value={value.description} onChange={(e) => update("description", e.target.value)} /></label>
      <label><span>Tags</span><Input disabled={readOnly} placeholder="combat, movement, magic" value={value.tags.join(", ")} onChange={(e) => update("tags", e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} /></label>

      <section className="trait-editor__mechanics">
        <div className="trait-editor__section-heading"><h3>Structured mechanics</h3><span>Optional</span></div>
        <label className="trait-editor__checkbox"><input disabled={readOnly} type="checkbox" checked={hasStructuredData} onChange={(e) => updateData(e.target.checked ? { attackBonus: 0 } : emptyTraitMechanics())} /><span>Include combat fields</span></label>
        {hasStructuredData && <div className="trait-editor__grid">
          <label><span>Attack bonus</span><Input disabled={readOnly} type="number" value={value.data.attackBonus ?? 0} onChange={(e) => updateData({ attackBonus: Number(e.target.value) })} /></label>
          <label><span>Save DC</span><Input disabled={readOnly} type="number" value={value.data.saveDC ?? 0} onChange={(e) => updateData({ saveDC: Number(e.target.value) })} /></label>
          <label><span>Extra attacks</span><Input disabled={readOnly} min={1} type="number" value={value.data.extraAttacksCount ?? 1} onChange={(e) => updateData({ extraAttacksCount: Number(e.target.value) })} /></label>
          <label className="trait-editor__checkbox"><input disabled={readOnly} type="checkbox" checked={value.data.damage !== null} onChange={(e) => updateData({ damage: e.target.checked ? createDefaultDamage() : null })} /><span>Deals damage</span></label>
          {value.data.damage && <>
            <label><span>Dice</span><Input disabled={readOnly} type="number" min={1} value={value.data.damage.diceCount} onChange={(e) => updateData({ damage: { ...value.data.damage!, diceCount: Number(e.target.value) } })} /></label>
            <label><span>Die type</span><select disabled={readOnly} value={value.data.damage.diceType} onChange={(e) => updateData({ damage: { ...value.data.damage!, diceType: e.target.value as typeof value.data.damage.diceType } })}>{DAMAGE_DIE_TYPES.map((die) => <option key={die}>{die}</option>)}</select></label>
            <label><span>Damage bonus</span><Input disabled={readOnly} type="number" value={value.data.damage.bonus} onChange={(e) => updateData({ damage: { ...value.data.damage!, bonus: Number(e.target.value) } })} /></label>
            <label><span>Damage type</span><select disabled={readOnly} value={value.data.damage.damageType} onChange={(e) => updateData({ damage: { ...value.data.damage!, damageType: e.target.value as typeof value.data.damage.damageType } })}>{DAMAGE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          </>}
        </div>}
      </section>
      {readOnly && <p className="trait-editor__readonly">Built-in components are read-only. Duplicate this entry to create an editable custom copy.</p>}
      {!readOnly && <Button variant="ghost" type="button" onClick={() => onChange({ ...value, data: normalizeTraitMechanics(value.data) })}>Normalize optional fields</Button>}
    </div>
  );
}
