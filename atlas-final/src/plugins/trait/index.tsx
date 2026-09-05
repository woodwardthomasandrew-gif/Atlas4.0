import { registerNavItem } from "@app/navigation/navRegistry";
import { registerRoutes } from "@app/routes/routeRegistry";
import { TraitListPage } from "./pages/TraitListPage";
import { TraitEditPage } from "./pages/TraitEditPage";

export function registerTraitStudioPlugin(): void {
  registerNavItem({ id: "traits", label: "Trait Studio", path: "/traits", order: 25 });
  registerRoutes([
    { path: "/traits", element: <TraitListPage /> },
    { path: "/traits/:id", element: <TraitEditPage /> }
  ]);
}
