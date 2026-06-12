import type { ComponentType, ReactNode } from "react";
import { Card } from "@/shared/components/Card";

type MetricCardProps = {
  title: string;
  value: string;
  caption?: string;
  delta?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: "default" | "green" | "red" | "orange" | "purple";
  children?: ReactNode;
};

export function MetricCard({ title, value, caption, delta, icon: Icon, tone = "default", children }: MetricCardProps) {
  return (
    <Card compact>
      <div className="card-header">
        <div>
          <p className="muted">{title}</p>
          <div className="metric-value">
            {value} {delta ? <span className="delta">{delta}</span> : null}
          </div>
        </div>
        {Icon ? (
          <div className={`icon-tile${tone !== "default" ? ` ${tone}` : ""}`}>
            <Icon className="icon" />
          </div>
        ) : null}
      </div>
      {caption ? <p className="tiny">{caption}</p> : null}
      {children}
    </Card>
  );
}

