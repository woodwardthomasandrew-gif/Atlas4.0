import { HashRouter, useRoutes } from "react-router-dom";
import { ThemeProvider } from "@app/theme/ThemeProvider";
import { getRoutes } from "@app/routes/routes";
import { AppShell } from "@ui/layout/AppShell";

// Plugins must be registered before the route table and nav registry are
// read, so loading happens once at module init — before App ever renders —
// rather than in an effect (which would run after the first paint).
import "@app/registry/loadPlugins";

function AppRoutes(): JSX.Element | null {
  return useRoutes(getRoutes());
}

export function App(): JSX.Element {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </HashRouter>
    </ThemeProvider>
  );
}
