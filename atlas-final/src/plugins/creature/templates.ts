import { registerAssetTemplates, type AssetTemplate } from "@app/templates/templateCatalog";
import { validateCreature } from "./validate";
import type { CreatureAbilityEntry, CreatureData, CreatureSize } from "./schema";
import { createDefaultCreatureData } from "./schema";

interface DragonChassis {
  id: string;
  name: string;
  description: string;
  size: CreatureSize;
  cr: string;
  ac: number;
  hp: number;
  hitDice: string;
  scores: CreatureData["abilities"];
  walk: number;
  fly: number;
  swim: number;
  darkvision: number;
  blindsight: number;
  saves: CreatureData["savingThrows"];
  skills: CreatureData["skills"];
  attacks: string[];
  legendary: boolean;
}

function action(id: string, name: string, description: string, extraAttacksCount: number | null = null): CreatureAbilityEntry {
  return { id, name, description, attackBonus: null, damage: null, saveDC: null, extraAttacksCount };
}

const chassis: DragonChassis[] = [
  {
    id: "dragon-wyrmling-blank", name: "Dragon Wyrmling — Blank Template",
    description: "A young-dragon foundation. Customize AC, HP, ability scores, breath damage and type, reach, attacks, and identity.",
    size: "medium", cr: "1", ac: 15, hp: 32, hitDice: "5d8 + 10", scores: { str: 15, dex: 10, con: 13, int: 10, wis: 11, cha: 13 },
    walk: 30, fly: 60, swim: 0, darkvision: 60, blindsight: 10,
    saves: [{ name: "Dexterity", bonus: 2 }, { name: "Constitution", bonus: 3 }, { name: "Wisdom", bonus: 2 }, { name: "Charisma", bonus: 3 }],
    skills: [{ name: "Perception", bonus: 2 }], attacks: ["bite", "breath"], legendary: false
  },
  {
    id: "dragon-young-blank", name: "Young Dragon — Blank Template",
    description: "A mobile young-dragon foundation with a basic multiattack suite. Customize defenses, damage, reach, DCs, and identity.",
    size: "large", cr: "7", ac: 17, hp: 127, hitDice: "15d10 + 45", scores: { str: 19, dex: 10, con: 17, int: 12, wis: 13, cha: 15 },
    walk: 40, fly: 80, swim: 0, darkvision: 120, blindsight: 30,
    saves: [{ name: "Dexterity", bonus: 3 }, { name: "Constitution", bonus: 6 }, { name: "Wisdom", bonus: 4 }, { name: "Charisma", bonus: 5 }],
    skills: [{ name: "Perception", bonus: 7 }], attacks: ["multiattack", "bite", "claw", "breath"], legendary: false
  },
  {
    id: "dragon-adult-blank", name: "Adult Dragon — Blank Template",
    description: "An adult-dragon foundation with Legendary Resistance and structured legendary-action slots. Customize all family-specific mechanics.",
    size: "huge", cr: "15", ac: 19, hp: 200, hitDice: "16d12 + 96", scores: { str: 23, dex: 10, con: 21, int: 14, wis: 15, cha: 19 },
    walk: 40, fly: 80, swim: 0, darkvision: 120, blindsight: 60,
    saves: [{ name: "Dexterity", bonus: 5 }, { name: "Constitution", bonus: 10 }, { name: "Wisdom", bonus: 7 }, { name: "Charisma", bonus: 9 }],
    skills: [{ name: "Perception", bonus: 12 }], attacks: ["multiattack", "bite", "claw", "tail", "breath"], legendary: true
  },
  {
    id: "dragon-ancient-blank", name: "Ancient Dragon — Blank Template",
    description: "A high-tier dragon boss foundation with Legendary Resistance and legendary-action slots. Customize defenses, damage, DCs, and identity.",
    size: "gargantuan", cr: "23", ac: 22, hp: 300, hitDice: "24d20 + 48", scores: { str: 30, dex: 10, con: 29, int: 18, wis: 17, cha: 23 },
    walk: 40, fly: 80, swim: 0, darkvision: 120, blindsight: 60,
    saves: [{ name: "Dexterity", bonus: 7 }, { name: "Constitution", bonus: 16 }, { name: "Wisdom", bonus: 10 }, { name: "Charisma", bonus: 13 }],
    skills: [{ name: "Perception", bonus: 16 }], attacks: ["multiattack", "bite", "claw", "tail", "breath"], legendary: true
  }
];

function createDragonData(chassisEntry: DragonChassis): CreatureData {
  const data = createDefaultCreatureData();
  data.size = chassisEntry.size;
  data.creatureType = "dragon";
  data.alignment = "unaligned";
  data.challengeRating = chassisEntry.cr;
  data.proficiencyBonus = Math.floor((Number(chassisEntry.cr) - 1) / 4) + 2;
  data.armorClass = chassisEntry.ac;
  data.armorClassNote = "Baseline only — customize for this dragon.";
  data.hitPoints = chassisEntry.hp;
  data.hitDice = chassisEntry.hitDice;
  data.speed = { walk: chassisEntry.walk, climb: 0, fly: chassisEntry.fly, swim: chassisEntry.swim, burrow: 0 };
  data.abilities = { ...chassisEntry.scores };
  data.savingThrows = chassisEntry.saves.map((entry) => ({ ...entry }));
  data.skills = chassisEntry.skills.map((entry) => ({ ...entry }));
  data.senses.darkvision = { auto: false, value: chassisEntry.darkvision };
  data.senses.blindsight = { auto: false, value: chassisEntry.blindsight };
  data.languages = "Customize languages";
  data.actions = chassisEntry.attacks.map((key) => {
    switch (key) {
      case "multiattack": return action("template-multiattack", "Multiattack", "Customize which attacks this dragon makes and how many.", 2);
      case "bite": return action("template-bite", "Bite", "Melee Weapon Attack: customize reach, attack bonus, target, hit damage, and damage type.");
      case "claw": return action("template-claw", "Claw", "Melee Weapon Attack: customize reach, attack bonus, target, hit damage, and damage type.");
      case "tail": return action("template-tail", "Tail", "Melee Weapon Attack: customize reach, attack bonus, target, hit damage, and damage type.");
      default: return action("template-breath", "Breath Weapon", "Customize shape, area, damage type and dice; choose a saving throw ability and recharge.");
    }
  });
  if (chassisEntry.legendary) {
    data.traits = [action("template-legendary-resistance", "Legendary Resistance (3/Day)", "If the dragon fails a saving throw, it can choose to succeed instead.")];
    data.legendaryActions = [
      action("template-legendary-perception", "Detect", "The dragon makes a Wisdom (Perception) check."),
      action("template-legendary-tail", "Tail Attack", "Customize as an attack using the creature's tail."),
      action("template-legendary-wing", "Wing Attack (Costs 2 Actions)", "Customize effects, save, and damage; costs 2 legendary actions.")
    ];
  }
  data.notes = "BLANK CHASSIS: these are editable homebrew baselines, not a finished stat block. Revisit AC, HP, ability scores, CR, proficiency, saves, skills, senses, movement, languages, attack reach/targets/bonuses/damage, breath shape/type/damage/save/recharge, and defenses. No colour, species, or elemental affinity is assigned.";
  return data;
}

const dragonTemplates: AssetTemplate<CreatureData>[] = chassis.map((entry) => ({
  id: entry.id,
  name: entry.name,
  description: entry.description,
  assetType: "creature",
  category: "Dragon chassis",
  tags: ["dragon", "blank", entry.size],
  ruleset: "D&D 5e (2014 conventions); homebrew baseline",
  sourceNotes: "Original generic chassis; not a copy of an official statblock.",
  schemaVersion: 1,
  initialData: createDragonData(entry),
  validate: (data) => validateCreature(data).valid && Array.isArray(data.actions),
  refreshNestedIds: (data, createId) => {
    for (const key of ["traits", "actions", "bonusActions", "reactions", "legendaryActions", "lairActions", "mythicActions", "equipment", "lootTable"] as const) {
      data[key] = data[key].map((item) => ({ ...item, id: createId() })) as never;
    }
    return data;
  }
}));

interface CreatureFoundation {
  id: string;
  name: string;
  description: string;
  cr: string;
  proficiencyBonus: number;
  size: CreatureSize;
  ac: number;
  hp: number;
  hitDice: string;
  scores: CreatureData["abilities"];
  walk: number;
  climb?: number;
  fly?: number;
  swim?: number;
  darkvision?: number;
  saves?: CreatureData["savingThrows"];
  skills?: CreatureData["skills"];
  actions: Array<{ name: string; description: string; extraAttacksCount?: number }>;
  traits?: Array<{ name: string; description: string }>;
  bonusActions?: Array<{ name: string; description: string }>;
  reactions?: Array<{ name: string; description: string }>;
  legendaryActions?: Array<{ name: string; description: string }>;
  spellcaster?: boolean;
}

const foundations: CreatureFoundation[] = [
  {
    id: "creature-basic-soldier-guard", name: "Basic Soldier / Guard — Blank Template", description: "A straightforward standard combatant foundation. Customize its ancestry, equipment, attack profile, and tactical details.",
    cr: "1/2", proficiencyBonus: 2, size: "medium", ac: 16, hp: 18, hitDice: "4d8", scores: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 }, walk: 30,
    skills: [{ name: "Perception", bonus: 2 }], actions: [{ name: "Weapon Attack", description: "Melee or ranged weapon attack: customize weapon, reach or range, target, attack bonus, hit damage, and damage type." }]
  },
  {
    id: "creature-heavy-brute", name: "Heavy / Brute — Blank Template", description: "A durable melee threat with a hard-hitting attack slot. Customize its size, defenses, weapon, and damage.",
    cr: "2", proficiencyBonus: 2, size: "large", ac: 14, hp: 45, hitDice: "6d10 + 12", scores: { str: 18, dex: 10, con: 15, int: 8, wis: 11, cha: 9 }, walk: 30,
    saves: [{ name: "Constitution", bonus: 4 }], actions: [{ name: "Heavy Melee Attack", description: "Melee weapon attack: customize reach, target, attack bonus, hit damage, and damage type." }], traits: [{ name: "Brute Feature", description: "Optional slot for a simple durability or force feature; define its exact mechanics." }]
  },
  {
    id: "creature-skirmisher", name: "Skirmisher — Blank Template", description: "A mobile attacker built to reposition around a target. Customize movement modes, attack, and escape or pursuit feature.",
    cr: "1", proficiencyBonus: 2, size: "medium", ac: 14, hp: 27, hitDice: "6d8", scores: { str: 12, dex: 16, con: 12, int: 10, wis: 13, cha: 10 }, walk: 40,
    skills: [{ name: "Acrobatics", bonus: 5 }, { name: "Perception", bonus: 3 }], actions: [{ name: "Skirmish Attack", description: "Melee or ranged attack: customize reach or range, target, attack bonus, hit damage, and damage type." }], bonusActions: [{ name: "Reposition", description: "Optional movement or disengage-style feature; define distance, limits, and conditions." }]
  },
  {
    id: "creature-ranged-attacker", name: "Ranged Attacker — Blank Template", description: "A ranged-damage foundation with a simple melee fallback slot. Customize range, ammunition, cover, and damage.",
    cr: "1/2", proficiencyBonus: 2, size: "medium", ac: 13, hp: 16, hitDice: "3d8 + 3", scores: { str: 10, dex: 15, con: 12, int: 10, wis: 12, cha: 10 }, walk: 30,
    skills: [{ name: "Perception", bonus: 3 }], actions: [{ name: "Ranged Attack", description: "Ranged weapon attack: customize short/long range, target, attack bonus, hit damage, damage type, and ammunition." }, { name: "Melee Attack", description: "Optional close-range attack: customize reach, target, attack bonus, hit damage, and damage type." }]
  },
  {
    id: "creature-spellcaster", name: "Spellcaster — Blank Template", description: "A magical versatility foundation with an editable spellcasting block and an action slot. Add spells and set casting details for the concept.",
    cr: "2", proficiencyBonus: 2, size: "medium", ac: 12, hp: 40, hitDice: "9d8", scores: { str: 8, dex: 14, con: 12, int: 16, wis: 13, cha: 12 }, walk: 30,
    saves: [{ name: "Wisdom", bonus: 3 }, { name: "Intelligence", bonus: 5 }], skills: [{ name: "Arcana", bonus: 5 }], actions: [{ name: "Spell or Magical Attack", description: "Customize the spell or magical effect, targets, range, attack or save, damage, and usage limit." }], spellcaster: true
  },
  {
    id: "creature-predatory-beast", name: "Predatory Beast — Blank Template", description: "A natural-weapons and pursuit foundation. Customize anatomy, movement, senses, attack details, and hunting behavior.",
    cr: "1/2", proficiencyBonus: 2, size: "medium", ac: 13, hp: 16, hitDice: "3d8 + 3", scores: { str: 14, dex: 14, con: 12, int: 3, wis: 12, cha: 6 }, walk: 40,
    skills: [{ name: "Perception", bonus: 3 }, { name: "Stealth", bonus: 4 }], actions: [{ name: "Natural Weapon", description: "Melee weapon attack: customize bite, claw, gore, or other anatomy; set reach, target, attack bonus, damage, and damage type." }], traits: [{ name: "Pursuit Feature", description: "Optional scent, tracking, or pursuit feature; define its senses, range, and limits." }]
  },
  {
    id: "creature-monstrous-creature", name: "Monstrous Creature — Blank Template", description: "A flexible unusual-anatomy foundation. Use its attack slots for distinctive body parts or effects and define their exact rules.",
    cr: "2", proficiencyBonus: 2, size: "large", ac: 14, hp: 45, hitDice: "6d10 + 12", scores: { str: 17, dex: 12, con: 15, int: 6, wis: 12, cha: 8 }, walk: 30,
    saves: [{ name: "Constitution", bonus: 4 }], actions: [{ name: "Primary Natural Attack", description: "Customize anatomy, reach, target, attack bonus, hit damage, and damage type." }, { name: "Secondary Attack or Effect", description: "Optional distinct attack or effect: customize target, save, damage, and limitations." }]
  },
  {
    id: "creature-controller", name: "Controller — Blank Template", description: "A battlefield-control foundation with structured action slots for hindering, moving, or dividing opponents. Define saves, areas, and duration.",
    cr: "2", proficiencyBonus: 2, size: "medium", ac: 13, hp: 40, hitDice: "9d8", scores: { str: 10, dex: 12, con: 12, int: 15, wis: 14, cha: 11 }, walk: 30,
    saves: [{ name: "Wisdom", bonus: 4 }], skills: [{ name: "Insight", bonus: 4 }], actions: [{ name: "Control Effect", description: "Customize area, targets, saving throw ability and DC, condition or movement, duration, and repeat saves." }, { name: "Follow-up Attack", description: "Optional attack: customize reach or range, target, attack bonus, damage, and damage type." }]
  },
  {
    id: "creature-commander", name: "Commander — Blank Template", description: "An ally-support and coordination foundation. Add an order or support feature and define its range, timing, and effect.",
    cr: "3", proficiencyBonus: 2, size: "medium", ac: 16, hp: 60, hitDice: "8d8 + 24", scores: { str: 13, dex: 12, con: 16, int: 12, wis: 14, cha: 16 }, walk: 30,
    saves: [{ name: "Wisdom", bonus: 4 }, { name: "Charisma", bonus: 5 }], skills: [{ name: "Persuasion", bonus: 5 }, { name: "Perception", bonus: 4 }], actions: [{ name: "Weapon Attack", description: "Customize weapon, reach or range, target, attack bonus, hit damage, and damage type." }], bonusActions: [{ name: "Coordinating Order", description: "Support scaffold: define eligible allies, range, timing, and the exact movement or attack granted." }], traits: [{ name: "Coordinated Tactics", description: "Optional passive ally-support feature; specify who benefits and its limits." }]
  },
  {
    id: "creature-elite", name: "Elite — Blank Template", description: "A strong individual-combatant foundation with multiattack and an optional signature feature. Customize all combat values and tactics.",
    cr: "4", proficiencyBonus: 2, size: "medium", ac: 17, hp: 75, hitDice: "10d8 + 30", scores: { str: 18, dex: 14, con: 16, int: 11, wis: 13, cha: 12 }, walk: 30,
    saves: [{ name: "Strength", bonus: 6 }, { name: "Constitution", bonus: 5 }], actions: [{ name: "Multiattack", description: "Customize the number and combination of attacks this creature makes.", extraAttacksCount: 2 }, { name: "Primary Attack", description: "Melee or ranged attack: customize reach or range, target, attack bonus, hit damage, and damage type." }], traits: [{ name: "Signature Feature", description: "Optional feature that distinguishes this elite combatant; define exact mechanics." }]
  },
  {
    id: "creature-legendary-monster", name: "Legendary Monster — Blank Template", description: "A boss-action framework with Legendary Resistance and structured legendary-action entries. Customize the action economy and each effect.",
    cr: "8", proficiencyBonus: 3, size: "large", ac: 17, hp: 136, hitDice: "16d10 + 48", scores: { str: 20, dex: 12, con: 17, int: 10, wis: 14, cha: 14 }, walk: 40,
    saves: [{ name: "Constitution", bonus: 6 }, { name: "Wisdom", bonus: 5 }], skills: [{ name: "Perception", bonus: 5 }], actions: [{ name: "Multiattack", description: "Customize the number and combination of attacks this creature makes.", extraAttacksCount: 2 }, { name: "Primary Attack", description: "Melee or ranged attack: customize reach or range, target, attack bonus, hit damage, and damage type." }], traits: [{ name: "Legendary Resistance (3/Day)", description: "If the creature fails a saving throw, it can choose to succeed instead. Customize the number of uses if needed." }], legendaryActions: [{ name: "Move", description: "The creature moves up to its speed without provoking opportunity attacks. Customize this option." }, { name: "Attack", description: "Customize a single attack option, including reach, target, attack bonus, and damage." }, { name: "Special Effect (Costs 2 Actions)", description: "Define a boss effect and its cost; customize any save, area, damage, or condition." }]
  },
  {
    id: "creature-artillery-heavy-weapons", name: "Artillery / Heavy Weapons — Blank Template", description: "A powerful ranged-threat foundation. Customize weapon or effect, range bands, reload cadence, ammunition, and protection from attackers.",
    cr: "2", proficiencyBonus: 2, size: "medium", ac: 13, hp: 45, hitDice: "6d8 + 18", scores: { str: 10, dex: 14, con: 16, int: 12, wis: 13, cha: 10 }, walk: 25,
    skills: [{ name: "Perception", bonus: 3 }], actions: [{ name: "Heavy Ranged Attack", description: "Ranged weapon or effect: customize short/long range, target, attack bonus, hit damage, damage type, and ammunition." }], traits: [{ name: "Reload or Set-up", description: "Optional cadence or positioning rule; define when the weapon can fire and any required action." }]
  }
];

function createFoundationData(foundation: CreatureFoundation): CreatureData {
  const data = createDefaultCreatureData();
  data.creatureType = "customize creature type";
  data.alignment = "unaligned";
  data.challengeRating = foundation.cr;
  data.proficiencyBonus = foundation.proficiencyBonus;
  data.armorClass = foundation.ac;
  data.armorClassNote = "Baseline only — customize for this creature.";
  data.hitPoints = foundation.hp;
  data.hitDice = foundation.hitDice;
  data.size = foundation.size;
  data.speed = { walk: foundation.walk, climb: foundation.climb ?? 0, fly: foundation.fly ?? 0, swim: foundation.swim ?? 0, burrow: 0 };
  data.abilities = { ...foundation.scores };
  data.savingThrows = (foundation.saves ?? []).map((entry) => ({ ...entry }));
  data.skills = (foundation.skills ?? []).map((entry) => ({ ...entry }));
  if (foundation.darkvision) data.senses.darkvision = { auto: false, value: foundation.darkvision };
  data.actions = foundation.actions.map((entry, index) => action(`template-${foundation.id}-action-${index}`, entry.name, entry.description, entry.extraAttacksCount ?? null));
  data.traits = (foundation.traits ?? []).map((entry, index) => action(`template-${foundation.id}-trait-${index}`, entry.name, entry.description));
  data.bonusActions = (foundation.bonusActions ?? []).map((entry, index) => action(`template-${foundation.id}-bonus-${index}`, entry.name, entry.description));
  data.reactions = (foundation.reactions ?? []).map((entry, index) => action(`template-${foundation.id}-reaction-${index}`, entry.name, entry.description));
  data.legendaryActions = (foundation.legendaryActions ?? []).map((entry, index) => action(`template-${foundation.id}-legendary-${index}`, entry.name, entry.description));
  if (foundation.spellcaster) {
    data.spellcasting = { ...data.spellcasting, enabled: true, ability: "int", saveDC: 12, attackBonus: 4, freeformNotes: "Add suitable spells and customize spell slots, save DC, attack bonus, and casting limits." };
  }
  data.notes = `BLANK ROLE FOUNDATION: editable homebrew starting point targeting CR ${foundation.cr}, not a finished stat block. Customize creature type, size, AC, HP, ability scores, CR, proficiency, saves, skills, speed, senses, languages, defenses, attack reach/range/targets/bonuses/damage, and all role-specific mechanics. The listed CR is a starting target, not a balance guarantee.`;
  return data;
}

const roleTemplates: AssetTemplate<CreatureData>[] = foundations.map((entry) => ({
  id: entry.id,
  name: entry.name,
  description: entry.description,
  assetType: "creature",
  category: "Creature foundation",
  tags: ["blank", entry.id.replace("creature-", "")],
  ruleset: "D&D 5e (2014 conventions); homebrew baseline",
  sourceNotes: "Generic role foundation; customize to the creature concept and encounter.",
  schemaVersion: 1,
  initialData: createFoundationData(entry),
  validate: (data) => validateCreature(data).valid && Array.isArray(data.actions),
  refreshNestedIds: (data, createId) => {
    for (const key of ["traits", "actions", "bonusActions", "reactions", "legendaryActions", "lairActions", "mythicActions", "equipment", "lootTable"] as const) {
      data[key] = data[key].map((item) => ({ ...item, id: createId() })) as never;
    }
    return data;
  }
}));

export function registerCreatureTemplates(): void {
  registerAssetTemplates([...dragonTemplates, ...roleTemplates]);
}

export { dragonTemplates, roleTemplates };
