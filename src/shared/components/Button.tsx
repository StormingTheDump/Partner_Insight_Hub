import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "green" | "danger";
  iconOnly?: boolean;
  children: ReactNode;
};

export function Button({ variant = "default", iconOnly = false, className = "", children, ...props }: ButtonProps) {
  const classes = ["button", variant !== "default" ? variant : "", iconOnly ? "icon-only" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

