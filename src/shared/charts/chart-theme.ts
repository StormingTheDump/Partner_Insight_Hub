import type { EChartsOption } from "echarts";

export const chartColors = ["#4f5fb8", "#12b981", "#f59e0b", "#ef4444", "#8b5cf6", "#e54897", "#3b82f6"];

export function withChartDefaults(option: EChartsOption): EChartsOption {
  return {
    color: chartColors,
    animationDuration: 450,
    grid: {
      left: 8,
      right: 16,
      top: 34,
      bottom: 28,
      containLabel: true,
      ...(Array.isArray(option.grid) ? {} : option.grid)
    },
    tooltip: {
      trigger: "axis",
      confine: true,
      appendToBody: false,
      ...(Array.isArray(option.tooltip) ? {} : option.tooltip)
    },
    legend: {
      type: "scroll",
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: "#526078", fontSize: 11 },
      ...(Array.isArray(option.legend) ? {} : option.legend)
    },
    textStyle: {
      fontFamily: "Poppins, Harmony Sans SC, Microsoft YaHei UI, system-ui, sans-serif"
    },
    ...option
  };
}

