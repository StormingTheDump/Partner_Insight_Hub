import { useEffect, useState } from "react";
import { Bed, CircleAlert, DollarSign, Target, TrendingUp } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { metricsApi, type OverviewData, type FunnelData } from "@/lib/metricsApi";
import type { EChartsOption } from "echarts";

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

function funnelOpt(funnel: FunnelData["overall"]): EChartsOption {
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c}" },
    series: [{
      type: "funnel" as const,
      left: "10%",
      width: "80%",
      minSize: "20%",
      maxSize: "100%",
      sort: "descending" as const,
      gap: 5,
      label: { show: true, position: "inside" as const, color: "#fff", fontSize: 12, fontWeight: 600,
        formatter: (p: { name: string; value: number }) => `${p.name}  ${p.value.toLocaleString()}` },
      itemStyle: { borderWidth: 0 },
      data: [
        { value: funnel.searches,  name: "查价数",    itemStyle: { color: "#4f5fb8" } },
        { value: funnel.results,   name: "有价数",    itemStyle: { color: "#6b7fd4" } },
        { value: funnel.confirms,  name: "验价数",    itemStyle: { color: "#12b981" } },
        { value: funnel.accurates, name: "准确验价数", itemStyle: { color: "#34d399" } },
        { value: funnel.bookings,  name: "下单数",    itemStyle: { color: "#f59e0b" } },
      ],
    }] as EChartsOption["series"],
  };
}

const metricIcons = [TrendingUp, TrendingUp, Bed, CircleAlert, CircleAlert];
const metricTones = ["purple", "purple", "orange", "red", "orange"] as const;

export function OverviewPage({ showPreviousPeriod }: PageProps) {
  const [data, setData]     = useState<OverviewData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([metricsApi.overview(), metricsApi.funnel()])
      .then(([o, f]) => { setData(o); setFunnel(f); })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data || !funnel) {
    return (
      <>
        <PageHeader title="概览" description="监控供应商交易额、订单量、错误率及渠道市场增长指标。" />
        <p className="tiny" style={{ padding: 32 }}>加载中…</p>
      </>
    );
  }

  const { summary, daily } = data;
  const { overall } = funnel;

  const overviewMetrics = [
    { title: "胜出率",       value: `${summary.win_rate}%`,                        key: "win_rate" },
    { title: "平均订单价值", value: `$${summary.avg_order_value.toLocaleString()}`, key: "avg_order_value" },
    { title: "间夜数",       value: summary.total_room_nights.toLocaleString(),     key: "room_nights" },
    { title: "预订前错误率", value: `${summary.avg_pre_error_rate}%`,               key: "pre_error_rate" },
    { title: "预订错误率",   value: `${summary.avg_book_error_rate}%`,              key: "book_error_rate" },
  ];

  return (
    <>
      <PageHeader title="概览" description="监控 Agoda 供应商交易额、订单量、转化漏斗及错误率指标。" />
      <div className="overview-grid">
        <div className="grid">

          {/* 漏斗 + 转化率 */}
          <Card>
            <div className="card-header">
              <div>
                <h3>下单转化漏斗</h3>
                <p className="tiny">查价 → 验价 → 下单，近30天 Agoda 全渠道。</p>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 13, flexWrap: "wrap" as const }}>
                <span>有价率 <strong style={{ color: "#4f5fb8" }}>{overall.result_rate}%</strong></span>
                <span>查价→验价 <strong style={{ color: "#12b981" }}>{overall.search_to_confirm}%</strong></span>
                <span>准确验价率 <strong style={{ color: "#34d399" }}>{overall.accurate_rate}%</strong></span>
                <span>验价→下单 <strong style={{ color: "#f59e0b" }}>{overall.confirm_to_book}%</strong></span>
                <span>平均响应 <strong>{overall.avg_response_ms}ms</strong></span>
              </div>
            </div>
            <BaseChart className="tall" option={funnelOpt(overall)} />
          </Card>

          {/* 交易额趋势 */}
          <ChartCard title="交易额趋势" metric={`$${(summary.total_ttv / 1000).toFixed(0)}K`} subtitle="所选时间段内的总交易额。">
            <BaseChart className="tall" option={lineOpt(daily.labels, daily.ttv, "交易额", "K", showPreviousPeriod)} />
          </ChartCard>

          <div className="grid two-col">
            <ChartCard title="胜出率" metric={`${summary.win_rate}%`}>
              <BaseChart className="small" option={lineOpt(daily.labels, daily.win_rate, "胜出率", "%", showPreviousPeriod)} />
            </ChartCard>
            <ChartCard title="总订单量" metric={summary.total_bookings.toLocaleString()}>
              <BaseChart className="small" option={lineOpt(daily.labels, daily.bookings, "订单量", "", showPreviousPeriod)} />
            </ChartCard>
          </div>

          <div className="grid two-col">
            {overviewMetrics.slice(1).map((metric, index) => {
              const Icon = metricIcons[index + 1];
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
              近30天 Agoda 总交易额 ${(summary.total_ttv / 1000).toFixed(0)}K，
              订单量 {summary.total_bookings.toLocaleString()}，
              漏斗整体转化率 {((overall.bookings / overall.searches) * 100).toFixed(1)}%。
            </p>
          </Card>
          <Card className="insight-card">
            <h3><Target className="icon" /> 提升查价成功率 <span className="priority">高优先级</span></h3>
            <p className="tiny">
              DidaOpaq 查价成功率仅 68%，低于 Agoda 的 82%，
              重点排查无房错误与超时问题。
            </p>
            <p className="delta tiny">提升至 78% 可增加约 1,400 次验价请求</p>
          </Card>
          <Card className="insight-card">
            <h3><Target className="icon" /> 优化验价→下单转化 <span className="priority medium">中优先级</span></h3>
            <p className="tiny">
              准确验价率 {overall.accurate_rate}%，
              价格变动是主要流失原因，可通过缓存锁价减少变动。
            </p>
            <p className="delta tiny">约增加订单量 5-8%</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
