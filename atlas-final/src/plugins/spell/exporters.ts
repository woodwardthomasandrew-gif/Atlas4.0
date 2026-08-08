import type { AssetExporter } from "@app/plugin-api/types";
import type { SpellData } from "./schema";
import {
  formatAreaOfEffect,
  formatComponentsLine,
  formatDamageHealingLine,
  formatLevelSchoolLine,
  formatResolutionLine
} from "./cardText";
import { renderSpellCardToPng } from "./cardRenderer";

const jsonExporter: AssetExporter<SpellData> = {
  id: "json",
  label: "JSON",
  fileExtension: "json",
  export: async (data, name) => {
    return JSON.stringify({ name, ...data }, null, 2);
  }
};

const markdownExporter: AssetExporter<SpellData> = {
  id: "markdown",
  label: "Markdown",
  fileExtension: "md",
  export: async (data, name) => {
    const lines: string[] = [
      `# ${name}`,
      `*${formatLevelSchoolLine(data)}*`,
      "",
      `**Casting Time** ${data.castingTime}`,
      `**Range** ${data.range}`,
      `**Components** ${formatComponentsLine(data.components)}`,
      `**Duration** ${data.duration}`,
      "",
      data.description,
      ""
    ];

    const damageHealingLine = formatDamageHealingLine(data);
    const areaLine = formatAreaOfEffect(data.areaOfEffect);
    const resolutionLine = formatResolutionLine(data);

    if (damageHealingLine) lines.push(`**Effect** ${damageHealingLine}`);
    if (areaLine) lines.push(`**Area** ${areaLine}`);
    if (data.conditionsApplied.length > 0) {
      lines.push(`**Conditions** ${data.conditionsApplied.join(", ")}`);
    }
    if (resolutionLine) lines.push(`**Resolution** ${resolutionLine}`);
    lines.push("");

    if (data.scaling.canUpcast && data.scaling.description) {
      lines.push("## At Higher Levels", "", data.scaling.description, "");
    }

    if (data.classes.length > 0) {
      lines.push(`*${data.classes.join(", ")}*`, "");
    }

    if (data.designerNotes.trim().length > 0) {
      lines.push("## Designer Notes", "", data.designerNotes, "");
    }

    return lines.join("\n");
  }
};

const pngExporter: AssetExporter<SpellData> = {
  id: "png",
  label: "PNG Card",
  fileExtension: "png",
  export: async (data, name) => {
    return renderSpellCardToPng(name, data);
  }
};

export const spellExporters: AssetExporter<SpellData>[] = [pngExporter, jsonExporter, markdownExporter];
