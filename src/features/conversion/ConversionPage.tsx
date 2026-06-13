import { useEffect, useState } from "react";
import type { EChartsOption } from "echarts";
import type { PageProps } from "@/dashboard/routes";
import { BaseChart } from "@/shared/charts/BaseChart";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { useAppState } from "@/dashboard/app-state";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const CHANNELS = ["Agoda", "AgodaEBK", "AgodaUK", "Lvzan", "DidaOpaq", "Barli2b"];

// 柔和色系：去饱和度的蓝/绿/金/青/紫/橙
const COLORS = ["#7aa8d8", "#5fad9a", "#c9a75c", "#5fa8c0", "#9b84cc", "#cc8f62"];

const THRESHOLDS = { l2b: 300_000, p2b: 1_500_000, l2c: 500, c2b: 500 };

const METRIC_DEFS = [
  {
    key: "l2b" as const,
    title: "L2B",
    cn: "请求订单转化比",
    formula: "look ÷ book",
    meaning: "多少次查价请求才产生 1 单。数值越小说明查价效率越高，超过 30 万为不合格。",
  },
  {
    key: "p2b" as const,
    title: "P2B",
    cn: "酒店请求订单转化比",
    formula: "property ÷ book",
    meaning: "多少次酒店查价请求才产生 1 单。property 为所有请求中涉及的酒店总数，超过 150 万为不合格。",
  },
  {
    key: "l2c" as const,
    title: "L2C",
    cn: "有价验价比",
    formula: "avail_look ÷ prebook",
    meaning: "多少次有价查价才触发 1 次验价。avail_look 为有返回价格的查价次数，超过 500 为不合格。",
  },
  {
    key: "c2b" as const,
    title: "C2B",
    cn: "验价订单转化比",
    formula: "prebook ÷ book",
    meaning: "多少次验价才产生 1 单。数值越小说明验价到下单转化越好，超过 500 为不合格。",
  },
];

type MetricKey = keyof typeof THRESHOLDS;

type ConvData = {
  dates: string[];
  summary: Record<MetricKey, number | null>;
  trends: Record<string, Record<MetricKey, (number | null)[]>>;
  agg_trend: Record<MetricKey, (number | null)[]>;
};

const axisText = { color: "#6b7f96", fontSize: 11 };

function fmtVal(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 10_000)    return `${Math.round(v / 1_000)}K`;
  return v.toLocaleString();
}

function singleTrendOption(
  dates: string[],
  values: (number | null)[],
  threshold: number,
  label: string,
): EChartsOption {
  return {
    grid: { left: 8, right: 24, top: 34, bottom: 28, containLabel: true },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { ...axisText, interval: 4, hideOverlap: true },
      axisLine: { lineStyle: { color: "#d4dbe6" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { ...axisText, formatter: (v: number) => fmtVal(v) },
      splitLine: { lineStyle: { color: "#edf1f7", type: "dashed" } },
    },
    series: [
      {
        name: `阈值 ${fmtVal(threshold)}`,
        type: "line",
        data: dates.map(() => threshold),
        showSymbol: false,
        lineStyle: { color: "#d9a0a0", type: "dashed", width: 1.5 },
        itemStyle: { color: "#d9a0a0" },
      },
      {
        name: label,
        type: "line",
        data: values,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: "#7aa8d8", width: 2.5 },
        itemStyle: { color: "#7aa8d8" },
        areaStyle: { color: "rgba(122,168,216,0.07)" },
      },
    ],
  };
}

function multiChannelTrendOption(
  dates: string[],
  trendsPerChannel: (number | null)[][],
  threshold: number,
): EChartsOption {
  return {
    grid: { left: 8, right: 16, top: 34, bottom: 28, containLabel: true },
    legend: { top: 4, textStyle: axisText },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { ...axisText, interval: 4, hideOverlap: true },
      axisLine: { lineStyle: { color: "#d4dbe6" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { ...axisText, formatter: (v: number) => fmtVal(v) },
      splitLine: { lineStyle: { color: "#edf1f7", type: "dashed" } },
    },
    series: [
      {
        name: `阈值`,
        type: "line",
        data: dates.map(() => threshold),
        showSymbol: false,
        lineStyle: { color: "#d9a0a0", type: "dashed", width: 1.5 },
        itemStyle: { color: "#d9a0a0" },
      },
      ...CHANNELS.map((ch, idx) => ({
        name: ch,
        type: "line" as const,
        data: trendsPerChannel[idx],
        smooth: true,
        showSymbol: false,
        lineStyle: { color: COLORS[idx], width: 2 },
        itemStyle: { color: COLORS[idx] },
      })),
    ],
  };
}

function getSummary(data: ConvData, feed: string): Record<MetricKey, number | null> {
  if (feed === "全部渠道") return data.summary;
  const t = data.trends[feed];
  if (!t) return { l2b: null, p2b: null, l2c: null, c2b: null };
  const avg = (arr: (number | null)[]) => {
    const valid = arr.filter((v): v is number => v !== null);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
  };
  return { l2b: avg(t.l2b), p2b: avg(t.p2b), l2c: avg(t.l2c), c2b: avg(t.c2b) };
}

export function ConversionPage(_: PageProps) {
  const { selectedFeed, dateRange } = useAppState();
  const [data, setData] = useState<ConvData | null>(null);

  const feed = selectedFeed;
  const clientId = feed !== "全部渠道" ? feed : undefined;

  useEffect(() => {
    const p = new URLSearchParams();
    if (clientId)       p.set("client_id",  clientId);
    if (dateRange?.[0]) p.set("start_date", dateRange[0]);
    if (dateRange?.[1]) p.set("end_date",   dateRange[1]);
    fetch(`${API_BASE}/api/conversion/metrics?${p}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [clientId, dateRange]);

  const summary = data ? getSummary(data, feed) : null;

  const getTrend = (key: MetricKey): (number | null)[] => {
    if (!data) return [];
    if (feed === "全部渠道") return data.agg_trend[key];
    return data.trends[feed]?.[key] ?? [];
  };

  const getAllTrends = (key: MetricKey): (number | null)[][] =>
    CHANNELS.map((ch) => data?.trends[ch]?.[key] ?? []);

  const METRICS = METRIC_DEFS.map((d) => d.key);

  return (
    <>
      <PageHeader
        title="转化指标"
        description="查价、验价、下单各环节转化比分析。数值越小越优，红色虚线为合格阈值。"
      />

      {/* 指标说明 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 16,
          background: "#f8fafc",
          border: "1px solid #e8edf4",
          borderRadius: 10,
          padding: "16px 20px",
        }}
      >
        {METRIC_DEFS.map((m) => (
          <div key={m.key}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#2c3e50" }}>
              {m.title}
            </span>
            <span style={{ fontSize: 12, color: "#7a8fa6", marginLeft: 6 }}>
              {m.cn}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                background: "#edf2f7",
                borderRadius: 4,
                padding: "1px 6px",
                marginLeft: 8,
                fontFamily: "var(--font-mono)",
              }}
            >
              {m.formula}
            </span>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#526078", lineHeight: 1.5 }}>
              {m.meaning}
            </p>
          </div>
        ))}
      </div>

      {/* 4 指标卡 */}
      <div className="grid four-col" style={{ marginTop: 16 }}>
        {METRICS.map((key) => {
          const def = METRIC_DEFS.find((d) => d.key === key)!;
          const v = summary?.[key] ?? null;
          const thr = THRESHOLDS[key];
          const qualified = v !== null && v <= thr;
          return (
            <MetricCard
              key={key}
              title={`${def.title} · ${def.cn}`}
              value={v !== null ? fmtVal(v) : "—"}
              tone={v === null ? undefined : qualified ? "green" : "red"}
              caption={`阈值 ≤ ${fmtVal(thr)}`}
            />
          );
        })}
      </div>

      {/* 4 趋势图 2×2 */}
      <div className="grid two-col" style={{ marginTop: 22 }}>
        {METRICS.map((key) => {
          const def = METRIC_DEFS.find((d) => d.key === key)!;
          const thr = THRESHOLDS[key];
          const option =
            feed === "全部渠道"
              ? multiChannelTrendOption(data?.dates ?? [], getAllTrends(key), thr)
              : singleTrendOption(data?.dates ?? [], getTrend(key), thr, def.title);

          return (
            <ChartCard key={key} title={`${def.title} 趋势`} subtitle={`${def.cn}（${def.formula}）`}>
              {data ? (
                <BaseChart className="small" option={option} />
              ) : (
                <div
                  className="small"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#b0bac8" }}
                >
                  加载中…
                </div>
              )}
            </ChartCard>
          );
        })}
      </div>
    </>
  );
}
