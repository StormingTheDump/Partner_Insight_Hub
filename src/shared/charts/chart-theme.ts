import type { EChartsOption } from "echarts";
import { withInteractiveChartBehavior } from "@/shared/charts/chart-motion";
import type { LegendSelection } from "@/shared/charts/chart-motion";

export { withChartEntryInitialState } from "@/shared/charts/chart-motion";

export const googlePaletteSwatch = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];
export const chartColors = googlePaletteSwatch;

function withSelectedLegend(legend: EChartsOption["legend"], legendSelection?: LegendSelection): EChartsOption["legend"] {
  if (!legendSelection) return legend;

  const mergeSelection = (item: unknown) => {
    if (!item || typeof item !== "object") {
      return { selected: legendSelection };
    }

    const record = item as Record<string, unknown>;
    const existingSelected =
      record.selected && typeof record.selected === "object" ? (record.selected as LegendSelection) : undefined;

    return {
      ...record,
      selected: {
        ...existingSelected,
        ...legendSelection
      }
    };
  };

  return Array.isArray(legend) ? legend.map(mergeSelection) : mergeSelection(legend);
}

export function withChartDefaults(option: EChartsOption, legendSelection?: LegendSelection): EChartsOption {
  const defaultLegend = {
    type: "scroll",
    top: 0,
    right: 0,
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: "#475569", fontSize: 11 },
    ...(Array.isArray(option.legend) ? {} : option.legend)
  };
  const legend = withSelectedLegend(Array.isArray(option.legend) ? option.legend : defaultLegend, legendSelection);

  return withInteractiveChartBehavior({
    color: chartColors,
    animationDuration: 650,
    animationDurationUpdate: 520,
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicInOut",
    animationThreshold: 4000,
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
    textStyle: {
      fontFamily: "Poppins, Harmony Sans SC, Microsoft YaHei UI, system-ui, sans-serif"
    },
    ...option,
    legend
  }, legendSelection);
}

