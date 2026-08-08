/**
 * Registry of reusable-component "slot" types (traits, actions, spell
 * effects, item properties, ...). Atlas 4.0 ships with the six statblock
 * slot types the Creature Builder uses, plus mythic actions since the
 * creature schema already models that seventh slot. Future plugins can
 * register additional component types (e.g. "spellEffect",
 * "itemProperty") without any change to this file's shape or to the
 * generic component store/library UI that consume it.
 */

export interface ComponentTypeDef {
  /** Stable, unique identifier, e.g. "trait". */
  id: string;
  /** Singular label, e.g. "Trait". */
  label: string;
  /** Plural label, e.g. "Traits". */
  pluralLabel: string;
}

const componentTypes: ComponentTypeDef[] = [
  { id: "trait", label: "Trait", pluralLabel: "Traits" },
  { id: "action", label: "Action", pluralLabel: "Actions" },
  { id: "bonusAction", label: "Bonus Action", pluralLabel: "Bonus Actions" },
  { id: "reaction", label: "Reaction", pluralLabel: "Reactions" },
  { id: "legendaryAction", label: "Legendary Action", pluralLabel: "Legendary Actions" },
  { id: "lairAction", label: "Lair Action", pluralLabel: "Lair Actions" },
  { id: "mythicAction", label: "Mythic Action", pluralLabel: "Mythic Actions" }
];

export function registerComponentType(def: ComponentTypeDef): void {
  if (componentTypes.some((t) => t.id === def.id)) return;
  componentTypes.push(def);
}

export function getComponentTypes(): ComponentTypeDef[] {
  return componentTypes;
}

export function getComponentType(id: string): ComponentTypeDef | undefined {
  return componentTypes.find((t) => t.id === id);
}
