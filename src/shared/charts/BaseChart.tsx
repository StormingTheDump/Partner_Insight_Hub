import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { useEffect, useMemo, useRef } from "react";
import { withChartDefaults } from "@/shared/charts/chart-theme";

type BaseChartProps = {
  option: EChartsOption;
  className?: "small" | "tall" | "spark";
  empty?: boolean;
  emptyLabel?: string;
};

export function BaseChart({ option, className, empty = false, emptyLabel = "No data for the selected filters." }: BaseChartProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const mergedOption = useMemo(() => withChartDefaults(option), [option]);

  useEffect(() => {
    if (!ref.current || empty) return undefined;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.setOption(mergedOption, true);

    const resize = () => chart.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(ref.current);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [empty, mergedOption]);

  useEffect(() => {
    if (chartRef.current && !empty) {
      chartRef.current.setOption(mergedOption, true);
    }
  }, [empty, mergedOption]);

  if (empty) {
    return <div className="empty-state">{emptyLabel}</div>;
  }

  return <div ref={ref} className={["chart-frame", className].filter(Boolean).join(" ")} />;
}

