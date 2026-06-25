import type { EChartsOption } from "echarts";
import { feeds, labels, series } from "@/data/chart-series";

const axisText = { color: "#475569", fontSize: 11 };
const chartPrimary = "#4F5AAB";
const previousLine = "#64748B";
const qualityBands = ["#DEF7E7", "#EDF8DC", "#FCF4DA", "#FDE3E3"];
const donutColors = ["#C3C6E2", "#B5BADC", "#A6ACD5", "#999FCE", "#8B92C8", "#7C84C1"];

export function lineOption(key: keyof typeof series, name: string, suffix = "", previous = false): EChartsOption {
  const values = series[key];
  const prevValues = values.map((value, index) => Math.max(1, Math.round(value * (0.84 + (index % 5) * 0.025))));
  return {
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { ...axisText, interval: 4, hideOverlap: true },
      axisLine: { lineStyle: { color: "#B4B8BF" } }
    },
    yAxis: {
      type: "value",
      axisLabel: { ...axisText, formatter: `{value}${suffix}` },
      splitLine: { lineStyle: { color: "#E5E7EB", type: "dashed" } }
    },
    series: [
      ...(previous
        ? [
            {
              name: "上期",
              type: "line" as const,
              data: prevValues,
              smooth: true,
              showSymbol: false,
              lineStyle: { color: previousLine, type: "dashed" as const, width: 2 }
            }
          ]
        : []),
      {
        name,
        type: "line",
        data: values,
        smooth: true,
        symbolSize: 5,
        lineStyle: { color: chartPrimary, width: 2.5 },
        itemStyle: { color: chartPrimary }
      }
    ]
  };
}

export function sparkOption(key: keyof typeof series): EChartsOption {
  return {
    grid: { left: 4, right: 4, top: 8, bottom: 8, containLabel: false },
    xAxis: { type: "category", data: labels, show: false },
    yAxis: { type: "value", show: false },
    tooltip: { show: false },
    legend: { show: false },
    series: [{ type: "line", data: series[key], smooth: true, showSymbol: false, lineStyle: { color: chartPrimary, width: 2.2 }, areaStyle: { color: chartPrimary, opacity: 0.08 } }]
  };
}

export function stackedBookingsOption(percent = false): EChartsOption {
  const weights = [0.11, 0.43, 0.08, 0.28, 0.13, 0.06];
  return {
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { ...axisText, interval: 5, hideOverlap: true },
      axisLine: { lineStyle: { color: "#B4B8BF" } }
    },
    yAxis: {
      type: "value",
      axisLabel: { ...axisText, formatter: percent ? "{value}%" : "{value}" },
      splitLine: { lineStyle: { color: "#E5E7EB", type: "dashed" } }
    },
    series: feeds.map((feed, feedIndex) => ({
      name: feed.name,
      type: "bar" as const,
      stack: "bookings",
      barWidth: "68%",
      data: series.bookings.map((value) => Math.max(1, Math.round(value * weights[feedIndex] * (percent ? 0.018 : 1)))),
      itemStyle: { color: feed.color }
    }))
  };
}

export function qualityOption(): EChartsOption {
  return {
    grid: { left: 8, right: 16, top: 34, bottom: 28, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { ...axisText, interval: 5, hideOverlap: true }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: axisText,
      splitLine: { lineStyle: { color: "#E5E7EB", type: "dashed" } }
    },
    series: feeds.slice(0, 4).map((feed, feedIndex) => ({
      name: feed.name,
      type: "line" as const,
      smooth: true,
      showSymbol: false,
      data: labels.map((_, index) => Math.max(0, Math.min(98, 72 + Math.sin((index + feedIndex) * 0.8) * 12 + Math.cos((index * feedIndex + 2) * 0.3) * 9))),
      markArea:
        feedIndex === 0
          ? {
              silent: true,
              itemStyle: { opacity: 0.4 },
              data: [
                [
                  { yAxis: 90, itemStyle: { color: qualityBands[0] } },
                  { yAxis: 100 }
                ],
                [
                  { yAxis: 70, itemStyle: { color: qualityBands[1] } },
                  { yAxis: 90 }
                ],
                [
                  { yAxis: 50, itemStyle: { color: qualityBands[2] } },
                  { yAxis: 70 }
                ],
                [
                  { yAxis: 0, itemStyle: { color: qualityBands[3] } },
                  { yAxis: 50 }
                ]
              ]
            }
          : undefined
    }))
  };
}

export function horizontalLossOption(): EChartsOption {
  return {
    grid: { left: 128, right: 18, top: 20, bottom: 28, containLabel: false },
    xAxis: {
      type: "value",
      max: 60000,
      axisLabel: axisText,
      splitLine: { lineStyle: { color: "#E5E7EB", type: "dashed" } }
    },
    yAxis: {
      type: "category",
      data: ["No available room.", "Miscellaneous"],
      axisLabel: { ...axisText, width: 118, overflow: "truncate" }
    },
    legend: { show: false },
    series: [{ type: "bar", data: [58500, 900], barWidth: 34, itemStyle: { color: "#4F5AAB", borderRadius: 4 } }]
  };
}

export function comboOption(): EChartsOption {
  return {
    xAxis: { type: "category", data: labels, axisLabel: { ...axisText, interval: 5, hideOverlap: true } },
    yAxis: [
      { type: "value", name: "TTV", axisLabel: { ...axisText, formatter: "${value}K" }, splitLine: { lineStyle: { color: "#E5E7EB", type: "dashed" } } },
      { type: "value", name: "Discount", min: 0, max: 1, axisLabel: { ...axisText, formatter: "{value}%" } }
    ],
    series: [
      { name: "Marketplace TTV", type: "bar", data: series.ttv, barWidth: "62%", itemStyle: { color: "#94A3B8", borderRadius: [3, 3, 0, 0] } },
      { name: "Effective discount", type: "line", yAxisIndex: 1, smooth: true, data: series.ttv.map((value) => Number((0.45 + (value % 42) / 100).toFixed(2))) }
    ]
  };
}

export function simpleBarOption(names: string[], values: number[], max?: number): EChartsOption {
  return {
    xAxis: {
      type: "category",
      data: names,
      axisLabel: { ...axisText, interval: 0, rotate: names.some((name) => name.length > 12) ? 25 : 0, hideOverlap: true }
    },
    yAxis: {
      type: "value",
      max,
      axisLabel: axisText,
      splitLine: { lineStyle: { color: "#E5E7EB", type: "dashed" } }
    },
    legend: { show: false },
    series: [{ type: "bar", data: values, barWidth: "48%", itemStyle: { color: chartPrimary, borderRadius: [4, 4, 0, 0] } }]
  };
}

export function hotelChainOption(): EChartsOption {
  const names = ["Minor", "Catalonia", "Highgate", "Motel One", "Ascott", "Dorsett", "Louvre", "Radisson", "Sonesta", "Hyatt", "Marriott", "Accor", "Wyndham", "Choice", "IHG", "Hilton", "Independent"];
  const values = names.map((_, index) => Number((0.18 + (Math.sin(index * 1.7) + 1) * 0.42 + (index % 6 === 0 ? 0.28 : 0)).toFixed(2)));
  return {
    grid: { left: 88, right: 20, top: 20, bottom: 18, containLabel: false },
    xAxis: { type: "value", max: 1.4, axisLabel: { ...axisText, formatter: "{value}%" }, splitLine: { lineStyle: { color: "#E5E7EB", type: "dashed" } } },
    yAxis: { type: "category", data: names, axisLabel: { ...axisText, width: 78, overflow: "truncate" } },
    legend: { show: false },
    series: [{ type: "bar", data: values, barWidth: 10, itemStyle: { color: chartPrimary, borderRadius: 3 } }]
  };
}

export function donutOption(): EChartsOption {
  return {
    tooltip: { trigger: "item", confine: true },
    legend: { type: "scroll", right: 0, top: "middle", orient: "vertical" },
    series: [
      {
        type: "pie",
        radius: ["42%", "68%"],
        center: ["34%", "52%"],
        avoidLabelOverlap: true,
        label: { show: false },
        data: [
          { name: "0% not used", value: 69.8, itemStyle: { color: donutColors[0] } },
          { name: "0-0.5%", value: 2.5, itemStyle: { color: donutColors[1] } },
          { name: "0.5-1%", value: 2.1, itemStyle: { color: donutColors[2] } },
          { name: "1-1.5%", value: 5.1, itemStyle: { color: donutColors[3] } },
          { name: "1.5-2%", value: 13.9, itemStyle: { color: donutColors[4] } },
          { name: "2-3%", value: 6.5, itemStyle: { color: donutColors[5] } }
        ]
      }
    ]
  };
}
