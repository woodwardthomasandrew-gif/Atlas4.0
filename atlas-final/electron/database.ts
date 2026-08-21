import path from "node:path";
import fs from "node:fs";
import initSqlJs, { Database } from "sql.js";

/**
 * Seed data for the built-in reusable statblock component library.
 * Small, curated, illustrative set — not an exhaustive 5e database.
 * Ids are fixed strings (not UUIDs) so re-seeding is idempotent and
 * the seed migration only ever runs once per database file.
 */
interface BuiltinComponentSeed {
  id: string;
  componentType: string;
  name: string;
  description: string;
  tags: string[];
  data: Record<string, unknown>;
}

const BUILTIN_COMPONENTS: BuiltinComponentSeed[] = [
  {
    id: "builtin-multiattack",
    componentType: "action",
    name: "Multiattack",
    description: "The creature makes multiple attacks.",
    tags: ["combat"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-pack-tactics",
    componentType: "trait",
    name: "Pack Tactics",
    description:
      "The creature has advantage on an attack roll against a creature if at least one of the creature's allies is within 5 feet of the creature and the ally isn't incapacitated.",
    tags: ["pack", "advantage"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-keen-smell",
    componentType: "trait",
    name: "Keen Smell",
    description: "The creature has advantage on Wisdom (Perception) checks that rely on smell.",
    tags: ["senses"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-keen-sight",
    componentType: "trait",
    name: "Keen Sight",
    description: "The creature has advantage on Wisdom (Perception) checks that rely on sight.",
    tags: ["senses"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-darkvision",
    componentType: "trait",
    name: "Darkvision",
    description:
      "The creature can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light. It can't discern color in darkness, only shades of gray.",
    tags: ["senses"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin-bite",
    componentType: "action",
    name: "Bite",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: piercing damage.",
    tags: ["weapon", "natural"],
    data: {
      attackBonus: 4,
      damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" },
      saveDC: null,
      extraAttacksCount: null
    }
  },
  {
    id: "builtin-claw",
    componentType: "action",
    name: "Claw",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: slashing damage.",
    tags: ["weapon", "natural"],
    data: {
      attackBonus: 4,
      damage: { diceCount: 1, diceType: "d4", bonus: 2, damageType: "slashing" },
      saveDC: null,
      extraAttacksCount: null
    }
  },
  {
    id: "builtin-longsword",
    componentType: "action",
    name: "Longsword",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: slashing damage.",
    tags: ["weapon", "martial"],
    data: {
      attackBonus: 4,
      damage: { diceCount: 1, diceType: "d8", bonus: 2, damageType: "slashing" },
      saveDC: null,
      extraAttacksCount: null
    }
  },
  {
    id: "builtin-shortbow",
    componentType: "action",
    name: "Shortbow",
    description: "Ranged Weapon Attack: range 80/320 ft., one target. Hit: piercing damage.",
    tags: ["weapon", "martial", "ranged"],
    data: {
      attackBonus: 4,
      damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" },
      saveDC: null,
      extraAttacksCount: null
    }
  },
  {
    id: "builtin-frightful-presence",
    componentType: "action",
    name: "Frightful Presence",
    description:
      "Each creature of the DM's choice within 120 feet of the creature and aware of it must succeed on a Wisdom saving throw or become frightened for 1 minute.",
    tags: ["fear", "aoe"],
    data: { attackBonus: null, damage: null, saveDC: 13, extraAttacksCount: null }
  },
  {
    id: "builtin-legendary-resistance",
    componentType: "legendaryAction",
    name: "Legendary Resistance",
    description: "If the creature fails a saving throw, it can choose to succeed instead.",
    tags: ["defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  }
];

/**
 * Second, much larger wave of built-in components (Atlas 4.0 Print Studio /
 * Creature Builder friction pass). Kept as a separate array/migration from
 * BUILTIN_COMPONENTS so the original seed migration (0004) never has to be
 * touched or re-run — new ids are simply inserted by migration 0005.
 * Covers Actions, Bonus Actions, Reactions, Legendary Actions, Mythic
 * Actions, and Traits with commonly recurring 5e-style entries.
 */
const BUILTIN_COMPONENTS_V2: BuiltinComponentSeed[] = [
  // --- Actions: natural weapons & common attacks ---
  {
    id: "builtin2-slam",
    componentType: "action",
    name: "Slam",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: bludgeoning damage.",
    tags: ["weapon", "natural"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "bludgeoning" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-tail",
    componentType: "action",
    name: "Tail",
    description: "Melee Weapon Attack: reach 10 ft., one target. Hit: bludgeoning damage.",
    tags: ["weapon", "natural"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d8", bonus: 2, damageType: "bludgeoning" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-gore",
    componentType: "action",
    name: "Gore",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: piercing damage.",
    tags: ["weapon", "natural"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-sting",
    componentType: "action",
    name: "Sting",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: piercing damage, and the target must make a Constitution saving throw against poison.",
    tags: ["weapon", "natural", "poison"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" }, saveDC: 11, extraAttacksCount: null }
  },
  {
    id: "builtin2-constrict",
    componentType: "action",
    name: "Constrict",
    description: "Melee Weapon Attack: reach 5 ft., one creature. Hit: bludgeoning damage, and the target is grappled (escape DC set by the GM).",
    tags: ["weapon", "natural", "grapple"],
    data: { attackBonus: 4, damage: { diceCount: 2, diceType: "d6", bonus: 3, damageType: "bludgeoning" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-dagger",
    componentType: "action",
    name: "Dagger",
    description: "Melee or Ranged Weapon Attack: reach 5 ft. or range 20/60 ft., one target. Hit: piercing damage.",
    tags: ["weapon", "martial", "finesse"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d4", bonus: 2, damageType: "piercing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-shortsword",
    componentType: "action",
    name: "Shortsword",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: piercing damage.",
    tags: ["weapon", "martial", "finesse"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-greatsword",
    componentType: "action",
    name: "Greatsword",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: slashing damage.",
    tags: ["weapon", "martial", "heavy"],
    data: { attackBonus: 5, damage: { diceCount: 2, diceType: "d6", bonus: 3, damageType: "slashing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-warhammer",
    componentType: "action",
    name: "Warhammer",
    description: "Melee Weapon Attack: reach 5 ft., one target. Hit: bludgeoning damage.",
    tags: ["weapon", "martial"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d8", bonus: 2, damageType: "bludgeoning" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-spear",
    componentType: "action",
    name: "Spear",
    description: "Melee or Ranged Weapon Attack: reach 5 ft. or range 20/60 ft., one target. Hit: piercing damage.",
    tags: ["weapon", "martial"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "piercing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-longbow",
    componentType: "action",
    name: "Longbow",
    description: "Ranged Weapon Attack: range 150/600 ft., one target. Hit: piercing damage.",
    tags: ["weapon", "martial", "ranged"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d8", bonus: 2, damageType: "piercing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-fire-breath",
    componentType: "action",
    name: "Fire Breath (Recharge 5-6)",
    description: "The creature exhales fire in a 15-foot cone. Each creature in that area must make a Dexterity saving throw, taking fire damage on a failed save, or half as much damage on a successful one.",
    tags: ["breath", "aoe", "fire", "recharge"],
    data: { attackBonus: null, damage: { diceCount: 8, diceType: "d6", bonus: 0, damageType: "fire" }, saveDC: 15, extraAttacksCount: null }
  },
  {
    id: "builtin2-poison-breath",
    componentType: "action",
    name: "Poison Breath (Recharge 5-6)",
    description: "The creature exhales poisonous gas in a 15-foot cone. Each creature in that area must make a Constitution saving throw, taking poison damage on a failed save, or half as much damage on a successful one.",
    tags: ["breath", "aoe", "poison", "recharge"],
    data: { attackBonus: null, damage: { diceCount: 8, diceType: "d6", bonus: 0, damageType: "poison" }, saveDC: 15, extraAttacksCount: null }
  },
  {
    id: "builtin2-swallow",
    componentType: "action",
    name: "Swallow",
    description: "The creature makes one bite attack against a Medium or smaller target it is grappling. If the attack hits, the target is swallowed, and the grapple ends.",
    tags: ["grapple", "special"],
    data: { attackBonus: 4, damage: { diceCount: 2, diceType: "d6", bonus: 3, damageType: "piercing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-frightening-gaze",
    componentType: "action",
    name: "Frightening Gaze",
    description: "The creature fixes its gaze on one creature it can see within 30 feet of it. The target must succeed on a Wisdom saving throw or become frightened for 1 minute.",
    tags: ["fear", "gaze"],
    data: { attackBonus: null, damage: null, saveDC: 13, extraAttacksCount: null }
  },
  {
    id: "builtin2-spellcasting",
    componentType: "action",
    name: "Spellcasting",
    description: "The creature is a spellcaster. Its spellcasting ability is listed in the creature's stat block. It has spells prepared from its class spell list.",
    tags: ["spellcasting"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },

  // --- Bonus Actions ---
  {
    id: "builtin2-cunning-action",
    componentType: "bonusAction",
    name: "Cunning Action",
    description: "The creature can take the Dash, Disengage, or Hide action.",
    tags: ["mobility"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-second-wind",
    componentType: "bonusAction",
    name: "Second Wind",
    description: "The creature regains a small number of hit points.",
    tags: ["healing"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-teleport-bonus",
    componentType: "bonusAction",
    name: "Teleport",
    description: "The creature magically teleports, along with any equipment it is wearing or carrying, up to a set distance to an unoccupied space it can see.",
    tags: ["mobility", "magic"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-rally",
    componentType: "bonusAction",
    name: "Rally",
    description: "The creature bolsters an ally within 30 feet, granting it temporary hit points.",
    tags: ["support"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },

  // --- Reactions ---
  {
    id: "builtin2-parry",
    componentType: "reaction",
    name: "Parry",
    description: "The creature adds to its AC against one melee attack that would hit it. To do so, it must see the attacker and be wielding a melee weapon.",
    tags: ["defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-opportunity-attack",
    componentType: "reaction",
    name: "Opportunity Attack",
    description: "The creature makes one melee attack against a creature that moves out of its reach.",
    tags: ["combat"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "slashing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-uncanny-dodge",
    componentType: "reaction",
    name: "Uncanny Dodge",
    description: "The creature halves the damage it takes from an attack that hits it. It must be able to see the attacker.",
    tags: ["defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-deflect-missiles",
    componentType: "reaction",
    name: "Deflect Missiles",
    description: "The creature deflects or catches a ranged weapon attack that would hit it, reducing the damage it takes.",
    tags: ["defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-protective-strike",
    componentType: "reaction",
    name: "Protective Strike",
    description: "When a creature the guardian can see attacks a target other than itself and is within 5 feet of the target, the guardian can move up to half its speed and make one melee attack against the attacker.",
    tags: ["defensive", "support"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "slashing" }, saveDC: null, extraAttacksCount: null }
  },

  // --- Legendary Actions ---
  {
    id: "builtin2-legendary-detect",
    componentType: "legendaryAction",
    name: "Detect",
    description: "The creature makes a Wisdom (Perception) check.",
    tags: ["utility"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-legendary-attack",
    componentType: "legendaryAction",
    name: "Attack",
    description: "The creature makes one weapon attack.",
    tags: ["combat"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d6", bonus: 2, damageType: "slashing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-legendary-move",
    componentType: "legendaryAction",
    name: "Move",
    description: "The creature moves up to its speed without provoking opportunity attacks.",
    tags: ["mobility"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-legendary-tail-attack",
    componentType: "legendaryAction",
    name: "Tail Attack (Costs 2 Actions)",
    description: "The creature makes a tail attack.",
    tags: ["combat"],
    data: { attackBonus: 4, damage: { diceCount: 1, diceType: "d8", bonus: 2, damageType: "bludgeoning" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-legendary-wing-attack",
    componentType: "legendaryAction",
    name: "Wing Attack (Costs 2 Actions)",
    description: "The creature beats its wings. Each creature within 10 feet of it must succeed on a Dexterity saving throw or take bludgeoning damage and be knocked prone. The creature can then fly up to half its flying speed.",
    tags: ["combat", "aoe"],
    data: { attackBonus: null, damage: { diceCount: 2, diceType: "d6", bonus: 0, damageType: "bludgeoning" }, saveDC: 15, extraAttacksCount: null }
  },
  {
    id: "builtin2-legendary-frightful-presence",
    componentType: "legendaryAction",
    name: "Frightful Presence (Costs 2 Actions)",
    description: "The creature uses its Frightful Presence.",
    tags: ["fear"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },

  // --- Mythic Actions ---
  {
    id: "builtin2-mythic-onslaught",
    componentType: "mythicAction",
    name: "Onslaught",
    description: "The creature makes one attack, adding an extra damage die to the damage.",
    tags: ["combat", "mythic"],
    data: { attackBonus: 4, damage: { diceCount: 2, diceType: "d6", bonus: 2, damageType: "slashing" }, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-mythic-terrifying-roar",
    componentType: "mythicAction",
    name: "Terrifying Roar",
    description: "The creature roars, and each creature within 60 feet that can hear it must succeed on a Wisdom saving throw or be frightened for 1 minute.",
    tags: ["mythic", "fear", "aoe"],
    data: { attackBonus: null, damage: null, saveDC: 16, extraAttacksCount: null }
  },
  {
    id: "builtin2-mythic-shockwave",
    componentType: "mythicAction",
    name: "Shockwave",
    description: "The creature slams the ground, and each creature within 30 feet must succeed on a Strength saving throw or take bludgeoning damage and be knocked prone.",
    tags: ["mythic", "aoe"],
    data: { attackBonus: null, damage: { diceCount: 4, diceType: "d6", bonus: 0, damageType: "bludgeoning" }, saveDC: 16, extraAttacksCount: null }
  },
  {
    id: "builtin2-mythic-regenerate",
    componentType: "mythicAction",
    name: "Regenerate",
    description: "The creature regains a large number of hit points.",
    tags: ["mythic", "healing"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },

  // --- Traits ---
  {
    id: "builtin2-legendary-resistance-trait",
    componentType: "trait",
    name: "Magic Resistance",
    description: "The creature has advantage on saving throws against spells and other magical effects.",
    tags: ["defensive", "magic"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-amphibious",
    componentType: "trait",
    name: "Amphibious",
    description: "The creature can breathe air and water.",
    tags: ["senses", "movement"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-brute",
    componentType: "trait",
    name: "Brute",
    description: "A melee weapon deals one extra die of its damage when the creature hits with it.",
    tags: ["combat"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-charge",
    componentType: "trait",
    name: "Charge",
    description: "If the creature moves at least 20 feet straight toward a target and then hits it with an attack on the same turn, the target takes extra damage.",
    tags: ["combat", "movement"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-flyby",
    componentType: "trait",
    name: "Flyby",
    description: "The creature doesn't provoke opportunity attacks when it flies out of an enemy's reach.",
    tags: ["movement"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-keen-hearing-smell",
    componentType: "trait",
    name: "Keen Hearing and Smell",
    description: "The creature has advantage on Wisdom (Perception) checks that rely on hearing or smell.",
    tags: ["senses"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-magic-weapons",
    componentType: "trait",
    name: "Magic Weapons",
    description: "The creature's weapon attacks are magical.",
    tags: ["combat", "magic"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-pounce",
    componentType: "trait",
    name: "Pounce",
    description: "If the creature moves at least 20 feet straight toward a creature and then hits it with a claw attack on the same turn, that target must succeed on a Strength saving throw or be knocked prone.",
    tags: ["combat", "movement"],
    data: { attackBonus: null, damage: null, saveDC: 13, extraAttacksCount: null }
  },
  {
    id: "builtin2-regeneration",
    componentType: "trait",
    name: "Regeneration",
    description: "The creature regains hit points at the start of its turn, unless it took a specific type of damage since its last turn or is reduced to 0 hit points.",
    tags: ["healing", "defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-sneak-attack",
    componentType: "trait",
    name: "Sneak Attack (1/Turn)",
    description: "The creature deals extra damage once per turn when it hits a target with a weapon attack and has advantage on the attack roll, or when the target is within 5 feet of an ally of the creature that isn't incapacitated.",
    tags: ["combat"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-spider-climb",
    componentType: "trait",
    name: "Spider Climb",
    description: "The creature can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check.",
    tags: ["movement"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-sunlight-sensitivity",
    componentType: "trait",
    name: "Sunlight Sensitivity",
    description: "While in sunlight, the creature has disadvantage on attack rolls, as well as on Wisdom (Perception) checks that rely on sight.",
    tags: ["senses", "weakness"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-turn-immunity",
    componentType: "trait",
    name: "Turn Immunity",
    description: "The creature is immune to effects that turn undead.",
    tags: ["undead", "defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-undead-fortitude",
    componentType: "trait",
    name: "Undead Fortitude",
    description: "If damage reduces the creature to 0 hit points, it must make a Constitution saving throw to drop to 1 hit point instead, unless the damage is radiant or from a critical hit.",
    tags: ["undead", "defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-water-breathing",
    componentType: "trait",
    name: "Water Breathing",
    description: "The creature can breathe only underwater.",
    tags: ["senses", "movement"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-legendary-resistance-3",
    componentType: "trait",
    name: "Legendary Resistance (3/Day)",
    description: "If the creature fails a saving throw, it can choose to succeed instead. It can use this trait a limited number of times per day.",
    tags: ["defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  },
  {
    id: "builtin2-mythic-trait",
    componentType: "trait",
    name: "Mythic Resistance",
    description: "While in its mythic phase, the creature has advantage on saving throws against effects that would reduce it to 0 hit points.",
    tags: ["mythic", "defensive"],
    data: { attackBonus: null, damage: null, saveDC: null, extraAttacksCount: null }
  }
];

/**
 * WebAssembly-based SQLite wrapper using sql.js.
 *
 * Atlas core only ever creates the `assets` table plus internal
 * bookkeeping (`_migrations`, `settings`). Asset PLUGINS are responsible
 * for their own schema (typically stored as validated JSON inside the
 * `assets.data` column, or via their own tables created through the same
 * query/run bridge). The core database layer has no knowledge of
 * creatures, spells, items, or any other concrete asset type.
 *
 * This version operates fully in-memory and serializes/deserializes
 * to/from the filesystem synchronously upon initialization and mutations.
 */
export class AtlasDatabase {
  private db: Database;
  private filePath: string;

  private constructor(db: Database, filePath: string) {
    this.db = db;
    this.filePath = filePath;
  }

  /**
   * Asynchronously initializes the sql.js database module and loads
   * the database file from disk if it exists.
   */
  static async init(filePath: string): Promise<AtlasDatabase> {
    const wasmPath = path.join(__dirname, "../node_modules/sql.js/dist/sql-wasm.wasm");
    const wasmBinary = fs.readFileSync(wasmPath);
    const SQL = await initSqlJs({ wasmBinary: wasmBinary.buffer as ArrayBuffer });

    let fileBuffer: Buffer | undefined;
    if (fs.existsSync(filePath)) {
      fileBuffer = fs.readFileSync(filePath);
    }

    const db = new SQL.Database(fileBuffer);
    db.run("PRAGMA foreign_keys = ON;");

    return new AtlasDatabase(db, filePath);
  }

  /**
   * Serializes the current in-memory database state and writes it to disk.
   */
  private save(): void {
    const data = this.db.export();
    fs.writeFileSync(this.filePath, Buffer.from(data));
  }

  migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    this.applyMigration("0001_create_assets_table", () => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          data TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);`);
    });

    this.applyMigration("0002_create_settings_table", () => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    });

    /**
     * Generic reusable-component library (Atlas 4.0 Part 1). Lives in core
     * rather than a plugin because it's designed to eventually back
     * component types across multiple asset types (spell effects, item
     * properties, etc.) — see src/app/registry/componentTypeRegistry.ts.
     * Component-type-specific structured fields (attack bonus, damage,
     * save DC, ...) are stored opaquely in the `data` JSON column; core
     * and this migration don't need to know their shape.
     */
    this.applyMigration("0003_create_components_table", () => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS components (
          id TEXT PRIMARY KEY,
          component_type TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          tags TEXT NOT NULL DEFAULT '[]',
          is_builtin INTEGER NOT NULL DEFAULT 0,
          data TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_components_type ON components(component_type);`);
    });

    this.applyMigration("0004_seed_builtin_components", () => {
      for (const c of BUILTIN_COMPONENTS) {
        this.db.run(
          `INSERT INTO components (id, component_type, name, description, tags, is_builtin, data)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [c.id, c.componentType, c.name, c.description, JSON.stringify(c.tags), JSON.stringify(c.data)]
        );
      }
    });

    /**
     * Expanded built-in component catalogue (friction-pass Part 3). Runs
     * as its own migration so it applies once to existing databases
     * without re-running or duplicating the original 0004 seed.
     */
    this.applyMigration("0005_seed_builtin_components_v2", () => {
      for (const c of BUILTIN_COMPONENTS_V2) {
        this.db.run(
          `INSERT INTO components (id, component_type, name, description, tags, is_builtin, data)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [c.id, c.componentType, c.name, c.description, JSON.stringify(c.tags), JSON.stringify(c.data)]
        );
      }
    });

    this.save();
  }

  private applyMigration(name: string, fn: () => void): void {
    const stmt = this.db.prepare("SELECT 1 FROM _migrations WHERE name = ?");
    stmt.bind([name]);
    const existing = stmt.step();
    stmt.free();

    if (existing) return;

    fn();
    this.db.run("INSERT INTO _migrations (name) VALUES (?)", [name]);
  }

  query(sql: string, params: unknown[] = []): unknown[] {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as any[]);
    const rows: unknown[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  run(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number | bigint } {
    this.db.run(sql, params as any[]);

    const res = this.db.exec("SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowid");
    const changes = (res[0]?.values[0][0] as number) ?? 0;
    const lastInsertRowid = (res[0]?.values[0][1] as number | bigint) ?? 0;

    this.save();
    return { changes, lastInsertRowid };
  }

  close(): void {
    this.db.close();
  }
}
