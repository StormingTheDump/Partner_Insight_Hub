import type { ReactNode } from "react";
import { Card } from "@/shared/components/Card";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  metric?: string;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function ChartCard({ title, subtitle, metric, actions, children, footer, className = "" }: ChartCardProps) {
  return (
    <Card className={className}>
      <div className="card-header">
        <div className="card-title">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="tiny">{subtitle}</p> : null}
          </div>
        </div>
        {metric ? <div className="metric-value">{metric}</div> : actions}
      </div>
      {children}
      {footer ? <div style={{ marginTop: 12 }}>{footer}</div> : null}
    </Card>
  );
}

