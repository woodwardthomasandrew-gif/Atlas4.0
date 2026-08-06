import type { HTMLAttributes } from "react";
import "./Badge.css";

export function Badge({ className, ...rest }: HTMLAttributes<HTMLSpanElement>): JSX.Element {
  const classes = ["atlas-badge", className].filter(Boolean).join(" ");
  return <span className={classes} {...rest} />;
}
