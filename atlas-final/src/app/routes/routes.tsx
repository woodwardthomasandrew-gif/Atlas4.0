import type { RouteObject } from "react-router-dom";
import { DashboardPage } from "@pages/dashboard/DashboardPage";
import { getPluginRoutes } from "./routeRegistry";
import { SettingsPage } from "@pages/settings/SettingsPage";

/**
 * Core route table. Only the dashboard is defined here — everything
 * else comes from plugin registrations via registerRoutes(), merged in
 * at call time so loadPlugins() has a chance to run first.
 */
function coreRoutes(): RouteObject[] {
  return [
    {
      path: "/",
      element: <DashboardPage />
    },
    { path: "/settings", element: <SettingsPage /> }
  ];
}

export function getRoutes(): RouteObject[] {
  return [...coreRoutes(), ...getPluginRoutes()];
}
