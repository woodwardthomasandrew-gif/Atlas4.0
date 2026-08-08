import type { AssetTypeDefinition } from "@app/plugin-api/types";
import { registerAssetType } from "@app/registry/assetRegistry";
import { registerNavItem } from "@app/navigation/navRegistry";
import { registerRoutes } from "@app/routes/routeRegistry";
import {
  PRINT_STUDIO_TYPE,
  printStudioSchema,
  createDefaultPrintLayoutData,
  type PrintLayoutData
} from "./schema";
import { validatePrintLayout } from "./validate";
import { printStudioExporters } from "./exporters";
import { PrintStudioEditor } from "./components/PrintStudioEditor";
import { PrintStudioPreview } from "./components/PrintStudioPreview";
import { PrintStudioListPage } from "./pages/PrintStudioListPage";
import { PrintStudioEditPage } from "./pages/PrintStudioEditPage";

export { PRINT_STUDIO_TYPE };

const printStudioDefinition: AssetTypeDefinition<PrintLayoutData> = {
  type: PRINT_STUDIO_TYPE,
  label: "Print Layout",
  pluralLabel: "Print Studio",
  schema: printStudioSchema,
  editor: PrintStudioEditor,
  preview: PrintStudioPreview,
  validate: validatePrintLayout,
  exporters: printStudioExporters,
  createDefaultData: createDefaultPrintLayoutData
};

export function registerPrintStudioPlugin(): void {
  registerAssetType(printStudioDefinition as AssetTypeDefinition<unknown>);

  registerNavItem({
    id: "print-studio",
    label: "Print Studio",
    path: "/print-studio",
    order: 40
  });

  registerRoutes([
    { path: "/print-studio", element: <PrintStudioListPage /> },
    { path: "/print-studio/:id", element: <PrintStudioEditPage /> }
  ]);
}
