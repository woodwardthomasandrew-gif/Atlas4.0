import type { InputHTMLAttributes } from "react";
import "./Input.css";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  const classes = ["atlas-input", className].filter(Boolean).join(" ");
  return <input className={classes} {...rest} />;
}
