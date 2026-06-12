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
  { key: "segment", header: "细分市场" },
  { key: "tolerance", header: "容差", align: "right" },
  { key: "impact", header: "预测影响", align: "right" },
  { key: "status", header: "状态", render: (row) => <StatusPill label={row.status} tone={row.status === "观察中" ? "warning" : "success"} /> }
];

export function MarketplaceConfigurationPage(_: PageProps) {
  const [tolerance, setTolerance] = useState(0.7);

  return (
    <>
      <PageHeader title="渠道配置" description="配置渠道级渠道市场激活、预算及价格容差。" />
      <div className="grid three-col">
        <MetricCard title="2026年Q2预测" value="$8,063,330" />
        <MetricCard title="渠道市场预测" value="$11,645,006" delta="+44.4%" tone="green" />
        <MetricCard title="季度进度" value="77%" caption="剩余21天。" />
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <Card>
          <div className="card-header">
            <div>
              <h3>价格容差调节</h3>
              <p className="tiny">调整模拟细分市场覆盖的渠道市场价格容差。</p>
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
            更高的容差可提升胜出率，但会增加渠道市场成本风险。
          </p>
        </Card>
        <Card>
          <h3>常见问题</h3>
          <div className="action-list">
            <div>容差如何影响价格检查停止？</div>
            <div>哪些渠道有资格获得渠道市场提升？</div>
            <div>细分市场覆盖优先级如何确定？</div>
          </div>
        </Card>
      </div>
      <div style={{ marginTop: 22 }}>
        <DataTable columns={columns} rows={marketplaceSegments} getRowKey={(row) => row.segment} />
      </div>
    </>
  );
}
