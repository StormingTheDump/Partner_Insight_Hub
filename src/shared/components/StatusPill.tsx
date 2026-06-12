import type { Tone } from "@/shared/types/table";

type StatusPillProps = {
  label: string;
  tone?: Tone;
};

export function StatusPill({ label, tone = "success" }: StatusPillProps) {
  const toneClass = tone === "success" ? "" : tone;
  return <span className={["status", toneClass].filter(Boolean).join(" ")}>{label}</span>;
}

