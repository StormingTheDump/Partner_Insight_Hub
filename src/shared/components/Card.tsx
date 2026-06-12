import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  soft?: boolean;
};

export function Card({ children, className = "", compact = false, soft = false }: CardProps) {
  return <article className={["card", compact ? "compact" : "", soft ? "soft" : "", className].filter(Boolean).join(" ")}>{children}</article>;
}

