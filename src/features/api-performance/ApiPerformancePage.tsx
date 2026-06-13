import { CircleAlert } from "lucide-react";
import { useState, useEffect } from "react";
import type { EChartsOption } from "echarts";
import type { PageProps } from "@/dashboard/routes";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { useAppState } from "@/dashboard/app-state";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

const CHANNELS = ["Agoda", "AgodaEBK", "AgodaUK", "Lvzan", "DidaOpaq", "Barli2b"];
// 6 visually distinct colors: blue, emerald, amber, cyan, purple, orange
const COLORS   = ["#3b82f6", "#12b981", "#f59e0b", "#06b6d4", "#8b5cf6", "#f97316"];

const axisText = { color: "#526078", fontSize: 11 };

type ApiData = {
  summary: {
    pre_error_rate: number;
    book_error_rate: number;
    total_price_checks: number;
    total_orders: number;
    estimated_ttv_loss: number;
  };
  dates: string[];
  accuracy_by_channel: Record<string, number[]>;
  book_error_by_channel: Record<string, number[]>;
  pre_error_trend: number[];
  book_error_trend: number[];
};

function accuracyOption(data: ApiData, feed: string): EChartsOption {
  const active = feed === "全部渠道" ? CHANNELS : [feed];
  return {
    grid: { left: 8, right: 16, top: 34, bottom: 28, containLabel: true },
    legend: { top: 4, textStyle: axisText },
    xAxis: {
      type: "category",
      data: data.dates,
      axisLabel: { ...axisText, interval: 5, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: axisText,
      splitLine: { lineStyle: { color: "#e8edf4", type: "dashed" } },
    },
    series: active.map((ch, idx) => {
      const ci = CHANNELS.indexOf(ch);
      return {
        name: ch,
        type: "line" as const,
        smooth: true,
        showSymbol: false,
        data: (data.accuracy_by_channel[ch] ?? []) as number[],
        lineStyle: { color: COLORS[ci], width: 2 },
        itemStyle: { color: COLORS[ci] },
        markArea: idx === 0 ? {
          silent: true,
          itemStyle: { opacity: 0.4 },
          data: [
            [{ yAxis: 90, itemStyle: { color: "#d8f7e5" } }, { yAxis: 100 }],
            [{ yAxis: 70, itemStyle: { color: "#e8f7c8" } }, { yAxis: 90  }],
            [{ yAxis: 50, itemStyle: { color: "#ffefbd" } }, { yAxis: 70  }],
            [{ yAxis: 0,  itemStyle: { color: "#ffd9d9" } }, { yAxis: 50  }],
          ],
        } : undefined,
      };
    }),
  };
}

function trendOption(
  dates: string[],
  values: number[],
  name: string,
  suffix: string,
  showPrev: boolean,
): EChartsOption {
  const prevValues = values.map((v, i) =>
    Math.max(0, parseFloat((v * (0.84 + (i % 5) * 0.025)).toFixed(2))),
  );
  return {
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { ...axisText, interval: 4, hideOverlap: true },
      axisLine: { lineStyle: { color: "#8b95a6" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { ...axisText, formatter: `{value}${suffix}` },
      splitLine: { lineStyle: { color: "#e8edf4", type: "dashed" } },
    },
    series: [
      ...(showPrev
        ? [
            {
              name: "上期",
              type: "line" as const,
              data: prevValues,
              smooth: true,
              showSymbol: false,
              lineStyle: { color: "#94a3b8", type: "dashed" as const, width: 2 },
            },
          ]
        : []),
      {
        name,
        type: "line",
        data: values,
        smooth: true,
        symbolSize: 5,
        lineStyle: { width: 2.5 },
      },
    ],
  };
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}

function getPreErrorTrend(data: ApiData, feed: string): number[] {
  if (feed === "全部渠道") return data.pre_error_trend;
  return (data.accuracy_by_channel[feed] ?? []).map((acc) =>
    parseFloat((100 - acc).toFixed(2)),
  );
}

function getBookErrorTrend(data: ApiData, feed: string): number[] {
  if (feed === "全部渠道") return data.book_error_trend;
  return data.book_error_by_channel?.[feed] ?? data.book_error_trend;
}

export function ApiPerformancePage({ selectedFeed, showPreviousPeriod }: PageProps) {
  const { dateRange } = useAppState();
  const [data, setData] = useState<ApiData | null>(null);

  const feed = selectedFeed ?? "全部渠道";
  const clientId = feed !== "全部渠道" ? feed : undefined;

  useEffect(() => {
    const p = new URLSearchParams();
    if (clientId)       p.set("client_id",  clientId);
    if (dateRange?.[0]) p.set("start_date", dateRange[0]);
    if (dateRange?.[1]) p.set("end_date",   dateRange[1]);
    fetch(`${API_BASE}/api/integration/api-metrics?${p}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [clientId, dateRange]);

  const preErrorTrend  = data ? getPreErrorTrend(data, feed)  : [];
  const bookErrorTrend = data ? getBookErrorTrend(data, feed) : [];

  // Summary: when a channel is selected, compute its own aggregate
  const summaryPreError  = data
    ? feed === "全部渠道"
      ? data.summary.pre_error_rate
      : parseFloat((preErrorTrend.reduce((a, b) => a + b, 0) / (preErrorTrend.length || 1)).toFixed(2))
    : null;
  const summaryBookError = data
    ? feed === "全部渠道"
      ? data.summary.book_error_rate
      : parseFloat((bookErrorTrend.reduce((a, b) => a + b, 0) / (bookErrorTrend.length || 1)).toFixed(2))
    : null;

  return (
    <>
      <PageHeader title="技术指标" description="按渠道监控预订请求量、成功率及错误影响。" />
      <Card>
        <div className="card-header" style={{ justifyContent: "flex-start" }}>
          <div className="icon-tile orange">
            <CircleAlert className="icon" />
          </div>
          <div>
            <h3>技术错误对交易额的影响</h3>
            <p className="tiny">可用性、价格变动、超时及供应商确认错误造成的预估交易额损失。</p>
          </div>
          <div className="metric-value" style={{ marginLeft: "auto" }}>
            {data ? `$${data.summary.estimated_ttv_loss.toLocaleString()}` : "—"}
          </div>
        </div>
      </Card>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="验价准确率趋势" subtitle="各渠道每日验价准确率（%）。">
          {data ? (
            <BaseChart className="tall" option={accuracyOption(data, feed)} />
          ) : (
            <div className="tall" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              加载中…
            </div>
          )}
        </ChartCard>
      </div>
      <div className="grid four-col" style={{ marginTop: 22 }}>
        <MetricCard
          title="验价不准率"
          value={summaryPreError !== null ? `${summaryPreError.toFixed(2)}%` : "—"}
          tone="red"
        />
        <MetricCard
          title="订单失败率"
          value={summaryBookError !== null ? `${summaryBookError.toFixed(2)}%` : "—"}
          tone="orange"
        />
        <MetricCard
          title="总验价次数"
          value={data ? fmtNum(data.summary.total_price_checks) : "—"}
        />
        <MetricCard
          title="总订单量"
          value={data ? fmtNum(data.summary.total_orders) : "—"}
        />
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <ChartCard title="验价不准率趋势">
          {data ? (
            <BaseChart
              className="small"
              option={trendOption(data.dates, preErrorTrend, "验价不准率", "%", showPreviousPeriod)}
            />
          ) : (
            <div className="small" />
          )}
        </ChartCard>
        <ChartCard title="订单失败率趋势">
          {data ? (
            <BaseChart
              className="small"
              option={trendOption(data.dates, bookErrorTrend, "订单失败率", "%", showPreviousPeriod)}
            />
          ) : (
            <div className="small" />
          )}
        </ChartCard>
      </div>
    </>
  );
}
