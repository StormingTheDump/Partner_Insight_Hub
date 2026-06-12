import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PageProps } from "@/dashboard/routes";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Button } from "@/shared/components/Button";
import { ChartCard } from "@/shared/components/ChartCard";
import { DataTable } from "@/shared/components/DataTable";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { SearchFilter } from "@/shared/components/FilterControl";
import { metricsApi, type PerformanceData, type PerformanceRow } from "@/lib/metricsApi";
import type { TableColumn } from "@/shared/types/table";
import type { EChartsOption } from "echarts";

const CLIENT_COLORS: Record<string, string> = {
  Agoda:     "#3b82f6",
  AgodaUK:   "#12b981",
  AgodaEBK:  "#f59e0b",
  Lvzan:     "#ef4444",
  Barli2b:   "#8b5cf6",
  DidaOpaq:  "#e54897",
};

function stackedOpt(data: PerformanceData["stacked"]): EChartsOption {
  const axisText = { color: "#526078", fontSize: 11 };
  return {
    xAxis: { type: "category", data: data.labels, axisLabel: { ...axisText, interval: 5, hideOverlap: true }, axisLine: { lineStyle: { color: "#8b95a6" } } },
    yAxis: { type: "value", axisLabel: { ...axisText }, splitLine: { lineStyle: { color: "#e8edf4", type: "dashed" } } },
    series: Object.entries(data.series).map(([name, values]) => ({
      name,
      type: "bar" as const,
      stack: "bookings",
      barWidth: "68%",
      data: values,
      itemStyle: { color: CLIENT_COLORS[name] ?? "#888" },
    })),
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
  };
}

const columns: TableColumn<PerformanceRow>[] = [
  { key: "client_id",       header: "Client ID" },
  { key: "wins",            header: "胜出次数",   align: "right" },
  { key: "opportunities",   header: "机会次数",   align: "right" },
  { key: "win_rate",        header: "胜出率",     align: "right" },
  { key: "bookings",        header: "订单数",     align: "right" },
  { key: "ttv",             header: "TTV ($)",    align: "right", render: (r) => r.ttv.toLocaleString() },
  { key: "avg_order_value", header: "均价 ($)",   align: "right" },
  { key: "room_nights",     header: "间夜数",     align: "right" },
];

export function PerformancePage({ selectedFeed }: PageProps) {
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    metricsApi.performance().then(setPerf).finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!perf) return [];
    return perf.rows.filter((r) => {
      if (selectedFeed !== "全部渠道" && r.client_id !== selectedFeed) return false;
      if (query && !r.client_id.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [perf, selectedFeed, query]);

  const summary = useMemo(() => {
    if (!rows.length) return null;
    return {
      bookings:  rows.reduce((s, r) => s + r.bookings, 0),
      ttv:       rows.reduce((s, r) => s + r.ttv, 0),
      rooms:     rows.reduce((s, r) => s + r.room_nights, 0),
      wins:      rows.reduce((s, r) => s + r.wins, 0),
      opps:      rows.reduce((s, r) => s + r.opportunities, 0),
    };
  }, [rows]);

  if (loading || !perf) {
    return (
      <>
        <PageHeader title="业绩表现" description="按渠道追踪订单量、胜出率、间夜数及营收。" />
        <p className="tiny" style={{ padding: 32 }}>加载中…</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="业绩表现"
        description="按 Client ID 追踪订单量、胜出率、间夜数及营收。"
        actions={
          <Button>
            <Download className="icon" /> 导出 CSV
          </Button>
        }
      />
      <div className="filter-row">
        <SearchFilter icon={<Search className="icon" />} placeholder="搜索 Client ID" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="grid metric-grid-5">
        <MetricCard title="总订单量"     value={summary ? summary.bookings.toLocaleString() : "-"} />
        <MetricCard title="总营收（TTV）" value={summary ? `$${summary.ttv.toLocaleString()}` : "-"} />
        <MetricCard title="平均订单价值" value={summary ? `$${Math.round(summary.ttv / summary.bookings)}` : "-"} />
        <MetricCard title="间夜数"       value={summary ? summary.rooms.toLocaleString() : "-"} />
        <MetricCard title="胜出率"       value={summary ? `${((summary.wins / summary.opps) * 100).toFixed(2)}%` : "-"} />
      </div>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="订单量趋势" subtitle="按 Client ID 叠加的日订单量（近30天）。">
          <BaseChart className="tall" option={stackedOpt(perf.stacked)} />
        </ChartCard>
      </div>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="各 Client ID 业绩" subtitle="按 Client ID 比较胜出次数、机会次数与TTV。">
          <DataTable columns={columns} rows={rows} getRowKey={(r) => r.client_id} />
        </ChartCard>
      </div>
    </>
  );
}
