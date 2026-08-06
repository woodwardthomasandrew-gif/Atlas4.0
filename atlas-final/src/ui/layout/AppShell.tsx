import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import "./AppShell.css";

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="atlas-app-shell">
      <Sidebar />
      <main className="atlas-app-shell__content">{children}</main>
    </div>
  );
}
