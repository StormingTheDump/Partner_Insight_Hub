import { useState } from "react";
import type { PageProps } from "@/dashboard/routes";
import { marketplaceSegments } from "@/data/dashboard";
import { Card } from "@/shared/components/Card";
import { DataTable } from "@/shared/components/DataTable";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import type { TableColumn } from "@/shared/types/table";

const columns: TableColumn<(typeof marketplaceSegments)[number]>[] = [
  { key: "segment", header: "Segment" },
  { key: "tolerance", header: "Tolerance", align: "right" },
  { key: "impact", header: "Forecast impact", align: "right" },
  { key: "status", header: "Status", render: (row) => <StatusPill label={row.status} tone={row.status === "Watch" ? "warning" : "success"} /> }
];

export function MarketplaceConfigurationPage(_: PageProps) {
  const [tolerance, setTolerance] = useState(0.7);

  return (
    <>
      <PageHeader title="Marketplace Configuration" description="Configure feed-level Marketplace activation, budgets, and price tolerance." />
      <div className="grid three-col">
        <MetricCard title="Q2 2026 Forecast" value="$8,063,330" />
        <MetricCard title="Marketplace Forecast" value="$11,645,006" delta="+44.4%" tone="green" />
        <MetricCard title="Quarter progress" value="77%" caption="21 days remaining." />
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <Card>
          <div className="card-header">
            <div>
              <h3>Price tolerance slider</h3>
              <p className="tiny">Adjust marketplace price tolerance for simulated segment overrides.</p>
            </div>
            <span className="status info">{tolerance.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={tolerance}
            onChange={(event) => setTolerance(Number(event.target.value))}
            style={{ width: "100%" }}
          />
          <p className="tiny" style={{ marginTop: 12 }}>
            Higher tolerance can improve win rate, but increases marketplace cost exposure.
          </p>
        </Card>
        <Card>
          <h3>FAQ</h3>
          <div className="action-list">
            <div>How does tolerance affect price-check stops?</div>
            <div>Which feeds are eligible for Marketplace boosts?</div>
            <div>How are segment overrides prioritized?</div>
          </div>
        </Card>
      </div>
      <div style={{ marginTop: 22 }}>
        <DataTable columns={columns} rows={marketplaceSegments} getRowKey={(row) => row.segment} />
      </div>
    </>
  );
}

