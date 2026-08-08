import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, type ButtonProps } from "@ui/components";
import { duplicateAsset } from "@app/db/assetStore";

export interface DuplicateAssetButtonProps {
  assetId: string;
  /** Base list route for this asset type, e.g. "/creatures". */
  basePath: string;
  variant?: ButtonProps["variant"];
  className?: string;
  label?: string;
}

/**
 * Generic "Duplicate" action (Atlas 4.0 Part 2), reused by every asset
 * type's list and editor pages. Duplicates the asset, then immediately
 * opens the duplicate in its editor so renaming it is the very next thing
 * the user does — no trip back through the asset library required.
 */
export function DuplicateAssetButton({
  assetId,
  basePath,
  variant = "secondary",
  className,
  label = "Duplicate"
}: DuplicateAssetButtonProps): JSX.Element {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleClick = async (e: MouseEvent): Promise<void> => {
    // Stops propagation so this can sit inside a card that's also a <Link>.
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    setBusy(true);
    try {
      const duplicate = await duplicateAsset(assetId);
      navigate(`${basePath}/${duplicate.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" variant={variant} className={className} onClick={handleClick} disabled={busy}>
      {busy ? "Duplicating…" : label}
    </Button>
  );
}
