import type { AssetExporter } from "@app/plugin-api/types";
import type { PrintLayoutData } from "./schema";
import { exportPrintLayoutToPdf } from "./exportPdf";

const pdfExporter: AssetExporter<PrintLayoutData> = {
  id: "pdf",
  label: "PDF",
  fileExtension: "pdf",
  export: async (data) => {
    return exportPrintLayoutToPdf(data);
  }
};

const jsonExporter: AssetExporter<PrintLayoutData> = {
  id: "json",
  label: "JSON",
  fileExtension: "json",
  export: async (data, name) => {
    return JSON.stringify({ name, ...data }, null, 2);
  }
};

export const printStudioExporters: AssetExporter<PrintLayoutData>[] = [pdfExporter, jsonExporter];
