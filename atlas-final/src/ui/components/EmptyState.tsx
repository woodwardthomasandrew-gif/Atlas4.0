import type { ReactNode } from "react";
import "./EmptyState.css";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="atlas-empty-state">
      <p className="atlas-empty-state__title">{title}</p>
      {description && <p className="atlas-empty-state__description">{description}</p>}
      {action}
    </div>
  );
}
