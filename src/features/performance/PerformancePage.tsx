import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { PageProps } from "@/dashboard/routes";
import { stackedBookingsOption } from "@/data/chart-options";
import { performanceRows } from "@/data/dashboard";
import { includesText } from "@/data/formatters";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Button } from "@/shared/components/Button";
import { ChartCard } from "@/shared/components/ChartCard";
import { DataTable } from "@/shared/components/DataTable";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { SearchFilter } from "@/shared/components/FilterControl";
import type { TableColumn } from "@/shared/types/table";

const columns: TableColumn<(typeof performanceRows)[number]>[] = [
  { key: "feed", header: "渠道" },
  { key: "wins", header: "胜出次数", align: "right" },
  { key: "opportunities", header: "机会次数", align: "right" },
  { key: "winRate", header: "胜出率", align: "right" },
  { key: "status", header: "状态" }
];

export function PerformancePage({ selectedFeed }: PageProps) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => performanceRows.filter((row) => (selectedFeed === "全部渠道" || row.feed === selectedFeed) && includesText(Object.values(row), query)),
    [query, selectedFeed]
  );

  return (
    <>
      <PageHeader
        title="业绩表现"
        description="按渠道追踪订单量、胜出率、间夜数及营收。"
        actions={
          <Button>
            <Download className="icon" /> 导出 CSV
          </Button>
        }
      />
      <div className="filter-row">
        <SearchFilter icon={<Search className="icon" />} placeholder="搜索渠道" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="filter-control" type="button">全部连锁</button>
        <button className="filter-control" type="button">全部提前期</button>
        <button className="filter-control" type="button">全部退款类型</button>
      </div>
      <div className="grid metric-grid-5">
        <MetricCard title="总订单量" value="10,599" />
        <MetricCard title="总营收（TTV）" value="$3,532,888" />
        <MetricCard title="平均订单价值" value="$333" />
        <MetricCard title="间夜数" value="21,907" />
        <MetricCard title="胜出率" value="2.7%" />
      </div>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="订单量趋势" subtitle="按渠道叠加的订单量。">
          <BaseChart className="tall" option={stackedBookingsOption(false)} />
        </ChartCard>
      </div>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="各渠道胜出率" subtitle="按来源渠道比较胜出次数与机会次数。">
          <DataTable columns={columns} rows={rows} getRowKey={(row) => row.feed} />
        </ChartCard>
      </div>
    </>
  );
}
