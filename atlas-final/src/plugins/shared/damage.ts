/**
 * Shared "damage" shape used across plugins (magic items, creature
 * actions, spells) so a single formatting/rendering path can handle all
 * of them consistently — and so a future CR estimator or Print Studio
 * can read structured damage data without caring which plugin it came
 * from.
 */

export type DamageDieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export const DAMAGE_DIE_TYPES: DamageDieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];

export type DamageType =
  | "acid"
  | "bludgeoning"
  | "cold"
  | "fire"
  | "force"
  | "lightning"
  | "necrotic"
  | "piercing"
  | "poison"
  | "psychic"
  | "radiant"
  | "slashing"
  | "thunder";

export const DAMAGE_TYPES: DamageType[] = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder"
];

export interface ItemDamage {
  diceCount: number;
  diceType: DamageDieType;
  bonus: number;
  damageType: DamageType;
}

export function createDefaultDamage(): ItemDamage {
  return {
    diceCount: 1,
    diceType: "d6",
    bonus: 0,
    damageType: "slashing"
  };
}

export function describeDamage(damage: ItemDamage): string {
  const bonus =
    damage.bonus ? (damage.bonus > 0 ? ` + ${damage.bonus}` : ` - ${Math.abs(damage.bonus)}`) : "";
  return `${damage.diceCount}${damage.diceType}${bonus} ${damage.damageType} damage`;
}

/** Average roll for a die type, used for CR-estimator-style math later. */
const DIE_AVERAGE: Record<DamageDieType, number> = {
  d4: 2.5,
  d6: 3.5,
  d8: 4.5,
  d10: 5.5,
  d12: 6.5,
  d20: 10.5
};

export function averageDamage(damage: ItemDamage): number {
  return damage.diceCount * DIE_AVERAGE[damage.diceType] + damage.bonus;
}
