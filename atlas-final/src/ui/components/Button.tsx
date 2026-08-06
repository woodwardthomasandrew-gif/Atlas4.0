import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({ variant = "secondary", className, ...rest }: ButtonProps): JSX.Element {
  const classes = ["atlas-button", `atlas-button--${variant}`, className].filter(Boolean).join(" ");
  return <button className={classes} {...rest} />;
}
