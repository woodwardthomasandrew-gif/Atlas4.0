import { describeDamage } from "@plugins/shared/damage";
import type { ItemCharges, ItemRarity } from "./schema";

export { describeDamage };

export function rarityClassName(rarity: ItemRarity): string {
  return `magic-item-card--${rarity.replace(/\s+/g, "-")}`;
}

export function formatChargesLine(charges: ItemCharges): string {
  const base = `${charges.current}/${charges.max} charges`;
  const recharge = charges.rechargeFormula
    ? `regains ${charges.rechargeFormula} charges at ${charges.rechargeTiming}`
    : `recharges at ${charges.rechargeTiming}`;
  return `${base} — ${recharge}`;
}
