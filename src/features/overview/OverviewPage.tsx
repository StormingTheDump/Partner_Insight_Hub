import { useEffect, useState, type CSSProperties } from "react";
import { Bed, CircleAlert, DollarSign, Target, TrendingUp } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { BaseChart } from "@/shared/charts/BaseChart";
import { googlePaletteSwatch } from "@/shared/charts/chart-theme";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { metricsApi, type OverviewData, type FunnelData } from "@/lib/metricsApi";
import { useAppState } from "@/dashboard/app-state";
import type { EChartsOption } from "echarts";

const axisText = { color: "#475569", fontSize: 11 };
const OVERVIEW_CARD_VALUE_COLOR = "#505AAC";
const COMPARISON_COLORS = {
  up: "#10B981",
  down: "#EF4444",
  flat: "#F59E0B",
} as const;

type ComparisonMeta = {
  direction: keyof typeof COMPARISON_COLORS;
  label: string;
};

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousDateRange(range: [string, string] | null): [string, string] | null {
  if (!range) return null;
  const start = parseDate(range[0]);
  const end = parseDate(range[1]);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days + 1);
  return [formatDate(previousStart), formatDate(previousEnd)];
}

function getFunnelScope(funnel: FunnelData, clientId?: string): FunnelData["overall"] {
  if (!clientId) return funnel.overall;
  const c = funnel.by_client.find(r => r.client_id === clientId);
  if (!c) return funnel.overall;
  return {
    searches: c.searches,
    results: c.results,
    confirms: c.confirms,
    accurates: c.accurates,
    bookings: c.bookings,
    result_rate: c.result_rate,
    search_to_confirm: c.search_to_confirm_rate,
    accurate_rate: c.accurate_rate,
    confirm_to_book: c.confirm_to_book_rate,
    avg_response_ms: c.avg_response_ms,
  };
}

function formatComparisonPercent(value: number): string {
  const abs = Math.abs(value);
  const rounded = abs < 10 ? abs.toFixed(1) : String(Math.round(abs));
  return `${rounded.replace(/\.0$/, "")}%`;
}

function getComparisonMeta(current: number, previous?: number | null): ComparisonMeta | null {
  if (!previous || previous <= 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const flatArrow = "→";
  if (Math.abs(delta) < 0.05) return { direction: "flat", label: `${flatArrow}0%` };
  return {
    direction: delta > 0 ? "up" : "down",
    label: `${delta > 0 ? "↑" : "↓"}${formatComparisonPercent(delta)}`,
  };
}

function comparisonBadgeStyle(comparison: ComparisonMeta): CSSProperties {
  const color = COMPARISON_COLORS[comparison.direction];
  return {
    alignSelf: "center",
    borderRadius: 999,
    background: `${color}18`,
    color,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1,
    padding: "5px 7px",
    whiteSpace: "nowrap",
  };
}

function lineOpt(labels: string[], values: number[], name: string, suffix = "", previous = false): EChartsOption {
  const prev = values.map((v, i) => Math.max(1, Math.round(v * (0.84 + (i % 5) * 0.025))));
  return {
    xAxis: { type: "category", data: labels, axisLabel: { ...axisText, interval: 4, hideOverlap: true }, axisLine: { lineStyle: { color: "#B4B8BF" } } },
    yAxis: { type: "value", axisLabel: { ...axisText, formatter: `{value}${suffix}` }, splitLine: { lineStyle: { color: "#E5E7EB", type: "dashed" } } },
    series: [
      ...(previous ? [{ name: "上期", type: "line" as const, data: prev, smooth: true, showSymbol: false, lineStyle: { color: "#64748B", type: "dashed" as const, width: 2 } }] : []),
      { name, type: "line" as const, data: values, smooth: true, symbolSize: 5, lineStyle: { color: "#4F5AAB", width: 2.5 }, itemStyle: { color: "#4F5AAB" } },
    ],
  };
}

function sparkOpt(labels: string[], values: number[]): EChartsOption {
  return {
    grid: { left: 4, right: 4, top: 8, bottom: 8, containLabel: false },
    xAxis: { type: "category", data: labels, show: false },
    yAxis: { type: "value", show: false },
    tooltip: { show: false },
    legend: { show: false },
    series: [{ type: "line", data: values, smooth: true, showSymbol: false, lineStyle: { color: "#4F5AAB", width: 2.2 }, areaStyle: { color: "#4F5AAB", opacity: 0.08 } }],
  };
}

function funnelOpt(f: FunnelData["overall"]): EChartsOption {
  const funnelStages = [
    { value: f.searches, name: "查价数" },
    { value: f.results, name: "有价数" },
    { value: f.confirms, name: "验价数" },
    { value: f.accurates, name: "准确验价数" },
    { value: f.bookings, name: "下单数" },
  ];

  return {
    tooltip: { trigger: "item", formatter: "{b}: {c}" },
    legend: { top: 0, right: 0, data: funnelStages.map((stage) => stage.name) },
    series: [{
      type: "funnel" as const,
      top: 52, bottom: 8,
      left: "10%", width: "80%", minSize: "20%", maxSize: "100%",
      sort: "descending" as const, gap: 5,
      label: { show: true, position: "inside" as const, color: "#fff", fontSize: 12, fontWeight: 600,
        formatter: (p: { name: string; value: number }) => `${p.name}  ${p.value.toLocaleString()}` },
      itemStyle: { borderWidth: 0 },
      data: funnelStages.map((stage, index) => ({
        ...stage,
        itemStyle: { color: googlePaletteSwatch[index % googlePaletteSwatch.length] },
      })),
    }] as EChartsOption["series"],
  };
}

const metricIcons = [TrendingUp, Bed, CircleAlert, CircleAlert];
const metricTones = ["purple", "orange", "red", "orange"] as const;

export function OverviewPage({ showPreviousPeriod }: PageProps) {
  const { selectedFeed, dateRange } = useAppState();
  const [data, setData]         = useState<OverviewData | null>(null);
  const [funnel, setFunnel]     = useState<FunnelData | null>(null);
  const [previousOverviewData, setPreviousOverviewData] = useState<OverviewData | null>(null);
  const [previousFunnel, setPreviousFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading]   = useState(true);

  const clientId = selectedFeed !== "全部渠道" ? selectedFeed : undefined;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      metricsApi.overview(clientId, dateRange?.[0], dateRange?.[1]),
      metricsApi.funnel(dateRange?.[0], dateRange?.[1]),
    ])
      .then(([o, f]) => { setData(o); setFunnel(f); })
      .finally(() => setLoading(false));
  }, [clientId, dateRange]);

  useEffect(() => {
    if (!showPreviousPeriod) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviousOverviewData(null);
      setPreviousFunnel(null);
      return;
    }

    const previousRange = getPreviousDateRange(dateRange);
    if (!previousRange) {
      setPreviousOverviewData(null);
      setPreviousFunnel(null);
      return;
    }

    setPreviousOverviewData(null);
    setPreviousFunnel(null);

    let cancelled = false;
    Promise.all([
      metricsApi.overview(clientId, previousRange[0], previousRange[1]),
      metricsApi.funnel(previousRange[0], previousRange[1]),
    ])
      .then(([o, f]) => {
        if (cancelled) return;
        setPreviousOverviewData(o);
        setPreviousFunnel(f);
      })
      .catch(() => {
        if (cancelled) return;
        setPreviousOverviewData(null);
        setPreviousFunnel(null);
      });

    return () => { cancelled = true; };
  }, [clientId, dateRange, showPreviousPeriod]);

  // 漏斗数据：有精确匹配时用 by_client，否则用 overall
  const funnelData: FunnelData["overall"] | null = funnel
    ? getFunnelScope(funnel, clientId)
    : null;
  const previousFunnelData: FunnelData["overall"] | null = previousFunnel
    ? getFunnelScope(previousFunnel, clientId)
    : null;

  if (!data || !funnelData) {
    return (
      <>
        <PageHeader title="概览" description="监控供应商交易额、订单量、转化漏斗及错误率指标。" />
        <p className="tiny" style={{ padding: 32 }}>{loading ? "加载中…" : "暂无数据"}</p>
      </>
    );
  }

  const { summary, daily } = data;
  const statCards = [
    {
      label: "查价数",
      value: funnelData.searches,
      displayValue: funnelData.searches.toLocaleString(),
      previousValue: previousFunnelData?.searches,
    },
    {
      label: "验价数",
      value: funnelData.confirms,
      displayValue: funnelData.confirms.toLocaleString(),
      previousValue: previousFunnelData?.confirms,
    },
    {
      label: "下单数",
      value: funnelData.bookings,
      displayValue: funnelData.bookings.toLocaleString(),
      previousValue: previousFunnelData?.bookings,
    },
    {
      label: "总 TTV",
      value: summary.total_ttv,
      displayValue: `$${(summary.total_ttv / 1000).toFixed(0)}K`,
      previousValue: previousOverviewData?.summary.total_ttv,
    },
  ];

  const overviewMetrics = [
    { title: "平均订单价值", value: `$${summary.avg_order_value.toLocaleString()}`, key: "avg_order_value" },
    { title: "间夜数",       value: summary.total_room_nights.toLocaleString(),     key: "room_nights" },
    { title: "预订前错误率", value: `${summary.avg_pre_error_rate}%`,               key: "pre_error_rate" },
    { title: "预订错误率",   value: `${summary.avg_book_error_rate}%`,              key: "book_error_rate" },
  ];

  return (
    <>
      <PageHeader
        title="概览"
        description="监控 Agoda 供应商交易额、订单量、转化漏斗及错误率指标。"
      />

      <div className="overview-grid">
        <div className="grid">

          {/* 查验订大指标 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {statCards.map(({ label, value, displayValue, previousValue }) => {
              const comparison = getComparisonMeta(value, previousValue);
              return (
                <Card key={label} compact>
                  <p className="tiny" style={{ margin: "0 0 6px", color: "#64748B", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: OVERVIEW_CARD_VALUE_COLOR, lineHeight: 1, minWidth: 0 }}>{displayValue}</span>
                    {showPreviousPeriod && comparison ? (
                      <span aria-label={`相比上期${comparison.label}`} style={comparisonBadgeStyle(comparison)}>
                        {comparison.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="tiny" style={{ margin: "6px 0 0", color: "#aab2c8" }}>
                    近30天 · {clientId ?? "全渠道"}
                  </p>
                </Card>
              );
            })}
          </div>

          {/* 下单转化漏斗 */}
          <Card>
            <div className="card-header">
              <div>
                <h3>下单转化漏斗</h3>
                <p className="tiny">查价 → 有价 → 验价 → 准确验价 → 下单，近30天{clientId ? ` · ${clientId}` : ""}。</p>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, flexWrap: "wrap" as const }}>
                <span>有价率 <strong style={{ color: "#4F5AAB" }}>{funnelData.result_rate}%</strong></span>
                <span>准确验价率 <strong style={{ color: "#10B981" }}>{funnelData.accurate_rate}%</strong></span>
                <span>验价→下单 <strong style={{ color: "#F59E0B" }}>{funnelData.confirm_to_book}%</strong></span>
                <span>响应 <strong>{funnelData.avg_response_ms}ms</strong></span>
              </div>
            </div>
            <BaseChart className="tall" option={funnelOpt(funnelData)} />
          </Card>

          {/* 交易额趋势 */}
          <ChartCard title="交易额趋势" metric={`$${(summary.total_ttv / 1000).toFixed(0)}K`} subtitle={`所选时间段内的总交易额${clientId ? `（${clientId}）` : ""}。`}>
            <BaseChart
              className="tall"
              option={lineOpt(daily.labels, daily.ttv, "交易额", "K", showPreviousPeriod)}
            />
          </ChartCard>

          <div className="grid two-col">
            <ChartCard title="平均响应时长" metric={`${summary.avg_response_ms}ms`} subtitle="查价 API 平均响应时间。">
              <BaseChart
                className="small"
                option={lineOpt(daily.labels, daily.avg_response_ms, "响应时长", "ms", showPreviousPeriod)}
              />
            </ChartCard>
            <ChartCard title="总订单量" metric={summary.total_bookings.toLocaleString()}>
              <BaseChart
                className="small"
                option={lineOpt(daily.labels, daily.bookings, "订单量", "", showPreviousPeriod)}
              />
            </ChartCard>
          </div>

          <div className="grid two-col">
            {overviewMetrics.map((metric, index) => {
              const Icon = metricIcons[index];
              const seriesKey = metric.key as keyof typeof daily;
              const values = daily[seriesKey] as number[];
              return (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  icon={Icon}
                  tone={metricTones[index + 1]}
                  caption={`所选时间段内${metric.title}的最新变动。`}
                >
                  <BaseChart className="spark" option={sparkOpt(daily.labels, values)} />
                </MetricCard>
              );
            })}
          </div>
        </div>

        <aside className="insight-rail">
          <Card className="insight-card">
            <h3><DollarSign className="icon" /> 关键时期洞察</h3>
            <p className="tiny">
              近30天{clientId ? ` ${clientId}` : " Agoda"} 总交易额 ${(summary.total_ttv / 1000).toFixed(0)}K，
              订单量 {summary.total_bookings.toLocaleString()}，
              漏斗整体转化率 {((funnelData.bookings / funnelData.searches) * 100).toFixed(1)}%。
            </p>
          </Card>
          <Card className="insight-card">
            <h3><Target className="icon" /> 提升查价成功率 <span className="priority">高优先级</span></h3>
            <p className="tiny">
              DidaOpaq 查价成功率仅 68%，低于 Agoda 的 82%，重点排查无房错误与超时问题。
            </p>
            <p className="delta tiny">提升至 78% 可增加约 1,400 次验价请求</p>
          </Card>
          <Card className="insight-card">
            <h3><Target className="icon" /> 优化验价→下单转化 <span className="priority medium">中优先级</span></h3>
            <p className="tiny">
              准确验价率 {funnelData.accurate_rate}%，价格变动是主要流失原因，可通过缓存锁价减少变动。
            </p>
            <p className="delta tiny">约增加订单量 5-8%</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
