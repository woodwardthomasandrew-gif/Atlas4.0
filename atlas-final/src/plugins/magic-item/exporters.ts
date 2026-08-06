import type { AssetExporter } from "@app/plugin-api/types";
import type { MagicItemData } from "./schema";

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
    return [
      `# ${name}`,
      "",
      `*${data.itemType}, ${data.rarity}${attunement}*`,
      "",
      data.description
    ].join("\n");
  }
};

export const magicItemExporters: AssetExporter<MagicItemData>[] = [jsonExporter, markdownExporter];
