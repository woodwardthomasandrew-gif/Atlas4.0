import { useEffect, type ReactNode } from "react";
import "./Modal.css";

export interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Slightly wider layout for content-heavy modals like the component library. */
  wide?: boolean;
}

/** Minimal generic overlay dialog. Closes on backdrop click or Escape. */
export function Modal({ title, onClose, children, wide }: ModalProps): JSX.Element {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="atlas-modal__backdrop" onClick={onClose}>
      <div
        className={`atlas-modal ${wide ? "atlas-modal--wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="atlas-modal__header">
          <h2>{title}</h2>
          <button type="button" className="atlas-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="atlas-modal__body">{children}</div>
      </div>
    </div>
  );
}
