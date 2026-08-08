import type { AssetExporter } from "@app/plugin-api/types";
import type { MagicItemData } from "./schema";
import { describeDamage, formatChargesLine } from "./cardText";
import { renderItemCardToPng } from "./cardRenderer";

const jsonExporter: AssetExporter<MagicItemData> = {
  id: "json",
  label: "JSON",
  fileExtension: "json",
  export: async (data, name) => {
    return JSON.stringify({ name, ...data }, null, 2);
  }
};

const markdownExporter: AssetExporter<MagicItemData> = {
  id: "markdown",
  label: "Markdown",
  fileExtension: "md",
  export: async (data, name) => {
    const attunement = data.requiresAttunement ? " (requires attunement)" : "";
    const lines = [
      `# ${name}`,
      "",
      `*${data.itemType}, ${data.rarity}${attunement}*`,
      "",
      `Weight: ${data.weightLb} lb   Value: ${data.valueGp} gp`,
      ""
    ];

    if (data.flavorText.trim().length > 0) {
      lines.push(`_${data.flavorText}_`, "");
    }

    if (data.mechanicalText.trim().length > 0) {
      lines.push(data.mechanicalText, "");
    }

    if (data.hasCharges) {
      lines.push("**Charges**", formatChargesLine(data.charges), "");
    }

    if (data.hasDamage) {
      lines.push("**Damage**", describeDamage(data.damage), "");
    }

    return lines.join("\n");
  }
};

const pngExporter: AssetExporter<MagicItemData> = {
  id: "png",
  label: "PNG Card",
  fileExtension: "png",
  export: async (data, name) => {
    return renderItemCardToPng(name, data);
  }
};

export const magicItemExporters: AssetExporter<MagicItemData>[] = [
  pngExporter,
  jsonExporter,
  markdownExporter
];
