import type { RouteObject } from "react-router-dom";

/**
 * Route registry. Plugins register their own routes here instead of
 * core's route table knowing about them. See src/app/routes/routes.tsx
 * for how these are merged with the core routes.
 */
const pluginRoutes: RouteObject[] = [];

export function registerRoutes(routes: RouteObject[]): void {
  pluginRoutes.push(...routes);
}

export function getPluginRoutes(): RouteObject[] {
  return pluginRoutes;
}
