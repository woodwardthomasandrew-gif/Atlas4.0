import type { AssetExporter } from "@app/plugin-api/types";
import type { CreatureData } from "./schema";
import {
  formatAbilityEntry,
  formatAbilityLine,
  formatCrLine,
  formatSensesLine,
  formatSpeedLine,
  sizeLabel
} from "./cardText";
import { renderCreatureCardToPng } from "./cardRenderer";

const jsonExporter: AssetExporter<CreatureData> = {
  id: "json",
  label: "JSON",
  fileExtension: "json",
  export: async (data, name) => {
    return JSON.stringify({ name, ...data }, null, 2);
  }
};

const markdownExporter: AssetExporter<CreatureData> = {
  id: "markdown",
  label: "Markdown",
  fileExtension: "md",
  export: async (data, name) => {
    const lines: string[] = [
      `# ${name}`,
      `*${sizeLabel(data.size)} ${data.creatureType}, ${data.alignment}*`,
      "",
      `**Armor Class** ${data.armorClass} ${data.armorClassNote}`.trim(),
      `**Hit Points** ${data.hitPoints}${data.hitDice ? ` (${data.hitDice})` : ""}`,
      `**Speed** ${formatSpeedLine(data)}`,
      "",
      formatAbilityLine(data),
      ""
    ];

    if (data.savingThrows.length > 0) {
      lines.push(
        `**Saving Throws** ${data.savingThrows.map((s) => `${s.name} ${s.bonus >= 0 ? "+" : ""}${s.bonus}`).join(", ")}`
      );
    }
    if (data.skills.length > 0) {
      lines.push(
        `**Skills** ${data.skills.map((s) => `${s.name} ${s.bonus >= 0 ? "+" : ""}${s.bonus}`).join(", ")}`
      );
    }
    if (data.damageVulnerabilities.length > 0) {
      lines.push(`**Damage Vulnerabilities** ${data.damageVulnerabilities.join(", ")}`);
    }
    if (data.damageResistances.length > 0) {
      lines.push(`**Damage Resistances** ${data.damageResistances.join(", ")}`);
    }
    if (data.damageImmunities.length > 0) {
      lines.push(`**Damage Immunities** ${data.damageImmunities.join(", ")}`);
    }
    if (data.conditionImmunities.length > 0) {
      lines.push(`**Condition Immunities** ${data.conditionImmunities.join(", ")}`);
    }
    lines.push(`**Senses** ${formatSensesLine(data)}`);
    if (data.languages) lines.push(`**Languages** ${data.languages}`);
    lines.push(`**Challenge** ${formatCrLine(data)}`, "");

    for (const trait of data.traits) {
      lines.push(`*${formatAbilityEntry(trait)}*`, "");
    }

    const actionGroups: Array<[string, CreatureData["actions"]]> = [
      ["Actions", data.actions],
      ["Bonus Actions", data.bonusActions],
      ["Reactions", data.reactions],
      ["Legendary Actions", data.legendaryActions],
      ["Lair Actions", data.lairActions],
      ["Mythic Actions", data.mythicActions]
    ];

    for (const [title, entries] of actionGroups) {
      if (entries.length === 0) continue;
      lines.push(`## ${title}`, "");
      for (const entry of entries) {
        lines.push(formatAbilityEntry(entry), "");
      }
    }

    if (data.regionalEffects.length > 0) {
      lines.push("## Regional Effects", "");
      for (const effect of data.regionalEffects) lines.push(`- ${effect}`);
      lines.push("");
    }

    if (data.notes.trim().length > 0) {
      lines.push("## Notes", "", data.notes, "");
    }

    return lines.join("\n");
  }
};

const pngExporter: AssetExporter<CreatureData> = {
  id: "png",
  label: "PNG Card",
  fileExtension: "png",
  export: async (data, name) => {
    return renderCreatureCardToPng(name, data);
  }
};

export const creatureExporters: AssetExporter<CreatureData>[] = [pngExporter, jsonExporter, markdownExporter];
