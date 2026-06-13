import { useEffect, useState } from "react";
import { Bed, CircleAlert, DollarSign, Search, Target, TrendingUp } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { SearchFilter } from "@/shared/components/FilterControl";
import { metricsApi, type OverviewData, type FunnelData } from "@/lib/metricsApi";
import type { EChartsOption } from "echarts";

const CLIENT_IDS = ["Agoda", "AgodaUK", "AgodaEBK", "Lvzan", "Barli2b", "DidaOpaq"];
const axisText = { color: "#526078", fontSize: 11 };

function lineOpt(labels: string[], values: number[], name: string, suffix = "", previous = false): EChartsOption {
  const prev = values.map((v, i) => Math.max(1, Math.round(v * (0.84 + (i % 5) * 0.025))));
  return {
    xAxis: { type: "category", data: labels, axisLabel: { ...axisText, interval: 4, hideOverlap: true }, axisLine: { lineStyle: { color: "#8b95a6" } } },
    yAxis: { type: "value", axisLabel: { ...axisText, formatter: `{value}${suffix}` }, splitLine: { lineStyle: { color: "#e8edf4", type: "dashed" } } },
    series: [
      ...(previous ? [{ name: "上期", type: "line" as const, data: prev, smooth: true, showSymbol: false, lineStyle: { color: "#94a3b8", type: "dashed" as const, width: 2 } }] : []),
      { name, type: "line" as const, data: values, smooth: true, symbolSize: 5, lineStyle: { width: 2.5 } },
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
    series: [{ type: "line", data: values, smooth: true, showSymbol: false, lineStyle: { width: 2.2 }, areaStyle: { opacity: 0.08 } }],
  };
}

function funnelOpt(f: FunnelData["overall"]): EChartsOption {
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c}" },
    series: [{
      type: "funnel" as const,
      left: "10%", width: "80%", minSize: "20%", maxSize: "100%",
      sort: "descending" as const, gap: 5,
      label: { show: true, position: "inside" as const, color: "#fff", fontSize: 12, fontWeight: 600,
        formatter: (p: { name: string; value: number }) => `${p.name}  ${p.value.toLocaleString()}` },
      itemStyle: { borderWidth: 0 },
      data: [
        { value: f.searches,  name: "查价数",    itemStyle: { color: "#4f5fb8" } },
        { value: f.results,   name: "有价数",    itemStyle: { color: "#6b7fd4" } },
        { value: f.confirms,  name: "验价数",    itemStyle: { color: "#12b981" } },
        { value: f.accurates, name: "准确验价数", itemStyle: { color: "#34d399" } },
        { value: f.bookings,  name: "下单数",    itemStyle: { color: "#f59e0b" } },
      ],
    }] as EChartsOption["series"],
  };
}

const metricIcons = [TrendingUp, Bed, CircleAlert, CircleAlert];
const metricTones = ["purple", "orange", "red", "orange"] as const;

export function OverviewPage({ showPreviousPeriod }: PageProps) {
  const [data, setData]         = useState<OverviewData | null>(null);
  const [funnel, setFunnel]     = useState<FunnelData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [clientQuery, setClientQuery] = useState("");

  // 精确匹配已知 client ID 时才作为筛选条件
  const activeClient = CLIENT_IDS.find(c => c.toLowerCase() === clientQuery.trim().toLowerCase()) ?? null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      metricsApi.overview(activeClient ?? undefined),
      metricsApi.funnel(),
    ])
      .then(([o, f]) => { setData(o); setFunnel(f); })
      .finally(() => setLoading(false));
  }, [activeClient]);

  // 漏斗数据：有精确匹配时用 by_client，否则用 overall
  const funnelData: FunnelData["overall"] | null = funnel
    ? activeClient
      ? (() => {
          const c = funnel.by_client.find(r => r.client_id === activeClient);
          if (!c) return funnel.overall;
          return {
            searches: c.searches, results: c.results, confirms: c.confirms,
            accurates: c.accurates, bookings: c.bookings,
            result_rate: c.result_rate, search_to_confirm: c.search_to_confirm_rate,
            accurate_rate: c.accurate_rate, confirm_to_book: c.confirm_to_book_rate,
            avg_response_ms: c.avg_response_ms,
          };
        })()
      : funnel.overall
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

      {/* 页面级 Client ID 筛选器 */}
      <div className="filter-row">
        <SearchFilter
          icon={<Search className="icon" />}
          placeholder="搜索 Client ID（如 Agoda、AgodaUK…）"
          value={clientQuery}
          onChange={(e) => setClientQuery(e.target.value)}
        />
        {activeClient && (
          <span style={{ fontSize: 12, color: "#4f5fb8", fontWeight: 600, padding: "4px 10px", background: "#eef1ff", borderRadius: 6 }}>
            {activeClient}
          </span>
        )}
        {clientQuery && !activeClient && (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            输入完整 Client ID 以筛选
          </span>
        )}
      </div>

      <div className="overview-grid">
        <div className="grid">

          {/* 查验订大指标 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "查价数", value: funnelData.searches.toLocaleString(), color: "#4f5fb8" },
              { label: "验价数", value: funnelData.confirms.toLocaleString(), color: "#12b981" },
              { label: "下单数", value: funnelData.bookings.toLocaleString(), color: "#f59e0b" },
              { label: "总 TTV", value: `$${(summary.total_ttv / 1000).toFixed(0)}K`,  color: "#e54897" },
            ].map(({ label, value, color }) => (
              <Card key={label} compact>
                <p className="tiny" style={{ margin: "0 0 6px", color: "#8390ad", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</p>
                <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <p className="tiny" style={{ margin: "6px 0 0", color: "#aab2c8" }}>
                  近30天 · {activeClient ?? "全渠道"}
                </p>
              </Card>
            ))}
          </div>

          {/* 下单转化漏斗 */}
          <Card>
            <div className="card-header">
              <div>
                <h3>下单转化漏斗</h3>
                <p className="tiny">查价 → 有价 → 验价 → 准确验价 → 下单，近30天{activeClient ? ` · ${activeClient}` : ""}。</p>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, flexWrap: "wrap" as const }}>
                <span>有价率 <strong style={{ color: "#4f5fb8" }}>{funnelData.result_rate}%</strong></span>
                <span>准确验价率 <strong style={{ color: "#34d399" }}>{funnelData.accurate_rate}%</strong></span>
                <span>验价→下单 <strong style={{ color: "#f59e0b" }}>{funnelData.confirm_to_book}%</strong></span>
                <span>响应 <strong>{funnelData.avg_response_ms}ms</strong></span>
              </div>
            </div>
            <BaseChart className="tall" option={funnelOpt(funnelData)} />
          </Card>

          {/* 交易额趋势 */}
          <ChartCard title="交易额趋势" metric={`$${(summary.total_ttv / 1000).toFixed(0)}K`} subtitle={`所选时间段内的总交易额${activeClient ? `（${activeClient}）` : ""}。`}>
            <BaseChart className="tall" option={lineOpt(daily.labels, daily.ttv, "交易额", "K", showPreviousPeriod)} />
          </ChartCard>

          <div className="grid two-col">
            <ChartCard title="平均响应时长" metric={`${summary.avg_response_ms}ms`} subtitle="查价 API 平均响应时间。">
              <BaseChart className="small" option={lineOpt(daily.labels, daily.avg_response_ms, "响应时长", "ms", showPreviousPeriod)} />
            </ChartCard>
            <ChartCard title="总订单量" metric={summary.total_bookings.toLocaleString()}>
              <BaseChart className="small" option={lineOpt(daily.labels, daily.bookings, "订单量", "", showPreviousPeriod)} />
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
              近30天{activeClient ? ` ${activeClient}` : " Agoda"} 总交易额 ${(summary.total_ttv / 1000).toFixed(0)}K，
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
