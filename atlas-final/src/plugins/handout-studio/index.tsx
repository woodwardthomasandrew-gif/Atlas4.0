import type { AssetTypeDefinition } from "@app/plugin-api/types";
import { registerAssetType } from "@app/registry/assetRegistry";
import { registerNavItem } from "@app/navigation/navRegistry";
import { registerRoutes } from "@app/routes/routeRegistry";
import { HANDOUT_TYPE, handoutSchema, createHandout, type HandoutData } from "./schema";
import { validateHandoutData } from "./validate";
import { HandoutEditor } from "./HandoutEditor";
import { HandoutListPage } from "./pages/HandoutListPage";
import { HandoutEditPage } from "./pages/HandoutEditPage";
import { exportHandoutPdf } from "./exportPdf";
export { HANDOUT_TYPE };
const definition: AssetTypeDefinition<HandoutData> = {
  type: HANDOUT_TYPE, label: "Handout", pluralLabel: "Handout Studio", schema: handoutSchema,
  editor: HandoutEditor, preview: () => <div>Handout document</div>, validate: validateHandoutData,
  exporters: [{ id: "pdf", label: "PDF", fileExtension: "pdf", export: exportHandoutPdf }], createDefaultData: createHandout
};
export function registerHandoutStudioPlugin(): void {
  registerAssetType(definition as AssetTypeDefinition<unknown>);
  registerNavItem({ id: "handout-studio", label: "Handout Studio", path: "/handout-studio", order: 50 });
  registerRoutes([{ path: "/handout-studio", element: <HandoutListPage /> }, { path: "/handout-studio/:id", element: <HandoutEditPage /> }]);
}
