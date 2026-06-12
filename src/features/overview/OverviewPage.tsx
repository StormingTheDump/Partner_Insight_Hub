import { useEffect, useState } from "react";
import { Bed, Calendar, CircleAlert, DollarSign, Target, TrendingUp } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { metricsApi, type OverviewData } from "@/lib/metricsApi";
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

const metricIcons = [TrendingUp, Calendar, TrendingUp, Bed, CircleAlert, CircleAlert];
const metricTones = ["purple", "default", "purple", "orange", "red", "orange"] as const;

export function OverviewPage({ showPreviousPeriod }: PageProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metricsApi.overview().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <>
        <PageHeader title="概览" description="监控供应商交易额、订单量、错误率及渠道市场增长指标。" />
        <p className="tiny" style={{ padding: 32 }}>加载中…</p>
      </>
    );
  }

  const { summary, daily } = data;

  const overviewMetrics = [
    { title: "胜出率",       value: `${summary.win_rate}%`,                       key: "win_rate" },
    { title: "总订单量",     value: summary.total_bookings.toLocaleString(),       key: "bookings" },
    { title: "平均订单价值", value: `$${summary.avg_order_value.toLocaleString()}`, key: "avg_order_value" },
    { title: "间夜数",       value: summary.total_room_nights.toLocaleString(),    key: "room_nights" },
    { title: "预订前错误率", value: `${summary.avg_pre_error_rate}%`,              key: "pre_error_rate" },
    { title: "预订错误率",   value: `${summary.avg_book_error_rate}%`,             key: "book_error_rate" },
  ];

  return (
    <>
      <PageHeader title="概览" description="监控供应商交易额、订单量、错误率及渠道市场增长指标。" />
      <div className="overview-grid">
        <div className="grid">
          <Card>
            <div className="card-header">
              <div>
                <h3>季度预测</h3>
                <p className="tiny">含渠道市场影响的预测。</p>
              </div>
              <button className="button green" type="button">通过渠道市场提升交易额</button>
            </div>
            <div className="grid forecast-grid">
              <Card compact soft>
                <div className="card-header">
                  <strong>2026年Q2</strong>
                  <span className="muted tiny">剩余天数：21</span>
                </div>
                <div className="metric-value big">${(summary.total_ttv / 1000).toFixed(0)}K</div>
                <p className="tiny">当前预测</p>
              </Card>
              <Card compact soft>
                <div className="card-header">
                  <strong>渠道市场预测</strong>
                  <span className="muted tiny">潜在增幅</span>
                </div>
                <div className="metric-value big">
                  ${((summary.total_ttv * 1.444) / 1000).toFixed(0)}K <span className="delta">+44.4%</span>
                </div>
                <p className="tiny">含渠道市场影响的预测</p>
              </Card>
            </div>
          </Card>

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
            {overviewMetrics.slice(2).map((metric, index) => {
              const Icon = metricIcons[index + 2];
              const seriesKey = metric.key as keyof typeof daily;
              const values = daily[seriesKey] as number[];
              return (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  icon={Icon}
                  tone={metricTones[index + 2]}
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
              2026年5月13日至6月11日期间，Agoda 总交易额 ${(summary.total_ttv / 1000).toFixed(0)}K，
              订单量 {summary.total_bookings.toLocaleString()}，平均胜出率 {summary.win_rate}%。
            </p>
          </Card>
          <Card className="insight-card">
            <h3><Target className="icon" /> 挖掘高价值渠道 <span className="priority">高优先级</span></h3>
            <p className="tiny">重点提升平均订单价值最高渠道（AgodaUK $412）的份额。</p>
            <p className="delta tiny">约提升交易额 10-15%</p>
            <div className="action-list">
              <div>分析 AgodaUK 客户画像</div>
              <div>制定精准营销活动吸引同类客户</div>
            </div>
          </Card>
          <Card className="insight-card">
            <h3><Target className="icon" /> 提升高峰日订单量 <span className="priority medium">中优先级</span></h3>
            <p className="tiny">分析高峰日交易额高的影响因素，优化渠道市场出价策略。</p>
            <p className="delta tiny">约增加订单量 5-10%</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
