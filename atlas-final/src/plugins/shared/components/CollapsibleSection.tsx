import { useState, type ReactNode } from "react";
import "./CollapsibleSection.css";

export interface CollapsibleSectionProps {
  title: string;
  /** Whether the section starts expanded. Defaults to collapsed — used for "advanced" fields. */
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children
}: CollapsibleSectionProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <button
        type="button"
        className="collapsible-section__header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={`collapsible-section__chevron ${open ? "collapsible-section__chevron--open" : ""}`}>
          ▸
        </span>
        <span>{title}</span>
      </button>
      {open && <div className="collapsible-section__body">{children}</div>}
    </div>
  );
}
