import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Card } from "@/shared/components/Card";
import { PageHeader } from "@/shared/components/PageHeader";
import { SearchFilter } from "@/shared/components/FilterControl";
import { metricsApi, type DimensionsData } from "@/lib/metricsApi";
import type { EChartsOption } from "echarts";

const CLIENT_IDS = ["Agoda", "AgodaUK", "AgodaEBK", "Lvzan", "Barli2b", "DidaOpaq"];

const LT_COLORS    = ["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#3b82f6"];
const CHAIN_COLORS  = ["#4f5fb8", "#12b981"];
const STAR_COLORS   = ["#94a3b8", "#cbd5e1", "#fbbf24", "#f59e0b", "#3b82f6", "#8b5cf6"];
const COUNTRY_COLORS = ["#3b82f6","#12b981","#f59e0b","#ef4444","#8b5cf6","#e54897","#06b6d4","#84cc16","#94a3b8"];

function hbarOpt(labels: string[], values: number[], colors: string[], unit = "订单"): EChartsOption {
  return {
    grid: { left: 72, right: 48, top: 8, bottom: 8, containLabel: false },
    xAxis: { type: "value", axisLabel: { color: "#526078", fontSize: 11 }, splitLine: { lineStyle: { color: "#e8edf4", type: "dashed" } } },
    yAxis: { type: "category", data: labels, inverse: true, axisLabel: { color: "#17213f", fontSize: 12 } },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tooltip: { formatter: (p: any) => `${p.name}：${p.value.toLocaleString()} ${unit}` },
    series: [{
      type: "bar",
      data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i % colors.length] } })),
      barMaxWidth: 28,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      label: { show: true, position: "right" as const, formatter: (p: any) => p.value.toLocaleString(), color: "#526078", fontSize: 11 },
    }],
  };
}

function donutOpt(data: { name: string; value: number; color: string }[]): EChartsOption {
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical" as const, right: 0, top: "center", textStyle: { color: "#17213f", fontSize: 12 } },
    series: [{
      type: "pie",
      radius: ["48%", "72%"],
      center: ["38%", "50%"],
      data: data.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 700 } },
    }],
  };
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{title}</h3>
      {subtitle && <p className="tiny" style={{ margin: "3px 0 0", color: "var(--muted)" }}>{subtitle}</p>}
    </div>
  );
}

const TH: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 2,
  background: "#f8fafd", color: "#526078",
  fontSize: 12, fontWeight: 800,
  padding: "11px 13px",
  borderBottom: "2px solid var(--line)",
  whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left",
};
const TD: React.CSSProperties = {
  padding: "11px 13px",
  borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

function DimTable({ rows, dimKey, dimLabel }: { rows: (Record<string, unknown>)[]; dimKey: string; dimLabel: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {[dimLabel, "订单数", "占比", "TTV ($)", "间夜数"].map(h => (
              <th key={h} style={{ ...TH, textAlign: h === dimLabel ? "left" : "right" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={TD}>{r[dimKey] as string}</td>
              <td style={{ ...TD, textAlign: "right" }}>{(r.bookings as number).toLocaleString()}</td>
              <td style={{ ...TD, textAlign: "right", color: "#4f5fb8" }}>{r.pct as number}%</td>
              <td style={{ ...TD, textAlign: "right" }}>{(r.ttv as number).toLocaleString()}</td>
              <td style={{ ...TD, textAlign: "right" }}>{(r.room_nights as number).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PerformancePage(_: PageProps) {
  const [data, setData]       = useState<DimensionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientQuery, setClientQuery] = useState("");

  const activeClient = CLIENT_IDS.find(c => c.toLowerCase() === clientQuery.trim().toLowerCase()) ?? null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    metricsApi.dimensions(activeClient ?? undefined)
      .then(setData)
      .finally(() => setLoading(false));
  }, [activeClient]);

  if (!data) {
    return (
      <>
        <PageHeader title="订单分析" description="按提前预订天数、酒店类型、目的地国家多维细分订单结构。" />
        <p className="tiny" style={{ padding: 32 }}>{loading ? "加载中…" : "暂无数据"}</p>
      </>
    );
  }

  const ltLabels      = data.lt.map(r => r.lt_bucket);
  const ltValues      = data.lt.map(r => r.bookings);
  const countryLabels = data.country.map(r => r.country);
  const countryValues = data.country.map(r => r.bookings);
  const chainDonut    = data.chain.map((r, i) => ({ name: r.chain_type, value: r.bookings, color: CHAIN_COLORS[i] }));
  const starLabels    = data.star.map(r => r.star_rating);
  const starValues    = data.star.map(r => r.bookings);

  return (
    <>
      <PageHeader title="订单分析" description={`按 LT / Chain / Country 细分近30天订单结构${activeClient ? `（${activeClient}）` : ""}。`} />

      <div className="filter-row">
        <SearchFilter
          icon={<Search className="icon" />}
          placeholder="搜索 Client ID（如 Agoda、AgodaUK…）"
          value={clientQuery}
          onChange={e => setClientQuery(e.target.value)}
        />
        {activeClient && (
          <span style={{ fontSize: 12, color: "#4f5fb8", fontWeight: 600, padding: "4px 10px", background: "#eef1ff", borderRadius: 6 }}>
            {activeClient}
          </span>
        )}
        {clientQuery && !activeClient && (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>输入完整 Client ID 以筛选</span>
        )}
      </div>

      <div className="grid" style={{ gap: 20 }}>

        {/* LT 分布 */}
        <Card>
          <SectionHeader title="提前预订天数（LT）分布" subtitle="订单按预订到入住的天数区间细分，短 LT 订单均价通常更高。" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
            <BaseChart style={{ height: 200 }} option={hbarOpt(ltLabels, ltValues, LT_COLORS)} />
            <DimTable rows={data.lt as unknown as Record<string, unknown>[]} dimKey="lt_bucket" dimLabel="LT 区间" />
          </div>
        </Card>

        {/* Chain 分布 */}
        <Card>
          <SectionHeader title="酒店类型（Chain / Independent）分布" subtitle="连锁酒店 vs 独立酒店的订单结构，影响均价和间夜数。" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "center" }}>
            <BaseChart style={{ height: 200 }} option={donutOpt(chainDonut)} />
            <DimTable rows={data.chain as unknown as Record<string, unknown>[]} dimKey="chain_type" dimLabel="酒店类型" />
          </div>
        </Card>

        {/* Star 分布 */}
        <Card>
          <SectionHeader title="酒店星级分布（0–5星）" subtitle="高星级酒店均价更高，低星级走量，结构反映渠道客群偏好。" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
            <BaseChart style={{ height: 220 }} option={hbarOpt(starLabels, starValues, STAR_COLORS)} />
            <DimTable rows={data.star as unknown as Record<string, unknown>[]} dimKey="star_rating" dimLabel="星级" />
          </div>
        </Card>

        {/* Country 分布 */}
        <Card>
          <SectionHeader title="目的地国家分布" subtitle="按订单量排序，反映渠道的热门目的地集中度。" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
            <BaseChart style={{ height: 260 }} option={hbarOpt(countryLabels, countryValues, COUNTRY_COLORS)} />
            <DimTable rows={data.country as unknown as Record<string, unknown>[]} dimKey="country" dimLabel="目的地" />
          </div>
        </Card>

      </div>
    </>
  );
}
