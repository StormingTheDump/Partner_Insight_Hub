import type { ReactNode } from "react";

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  render?: (row: T) => ReactNode;
};

export type Tone = "success" | "warning" | "danger" | "neutral" | "info";

