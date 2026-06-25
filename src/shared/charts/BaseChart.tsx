import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { withChartDefaults, withChartEntryInitialState } from "@/shared/charts/chart-theme";

const SET_OPTION_OPTIONS = { notMerge: true, lazyUpdate: false };
const LEGEND_SET_OPTION_OPTIONS = { notMerge: true, lazyUpdate: false, silent: true };
const INITIAL_ENTRY_ANIMATION_KEY = Symbol("initial-entry-animation-key");
const SELECT_ALL_LEGEND_NAME = "select all";
const SELECT_ALL_LEGEND_SERIES_ID = "__selectAllLegendAction";

type LegendSelectChangedParams = {
  name?: string;
  selected?: Record<string, boolean>;
  event?: {
    ctrlKey?: boolean;
    metaKey?: boolean;
    event?: {
      ctrlKey?: boolean;
      metaKey?: boolean;
    };
  };
};

type PointerModifier = {
  ctrlKey: boolean;
  metaKey: boolean;
  timestamp: number;
};

type ZrPointerEvent = {
  event?: {
    ctrlKey?: boolean;
    metaKey?: boolean;
  };
};

function cancelEntryFrames(frameIds: number[]) {
  frameIds.forEach((id) => window.cancelAnimationFrame(id));
  frameIds.length = 0;
}

function playEntryAnimation(chart: echarts.ECharts, nextOption: EChartsOption, frameIds: number[]) {
  cancelEntryFrames(frameIds);
  chart.setOption(withChartEntryInitialState(nextOption), SET_OPTION_OPTIONS);

  const firstFrame = window.requestAnimationFrame(() => {
    const secondFrame = window.requestAnimationFrame(() => {
      chart.setOption(nextOption, SET_OPTION_OPTIONS);
      frameIds.length = 0;
    });
    frameIds.push(secondFrame);
  });
  frameIds.push(firstFrame);
}

function normalizeEntryKeyValue(value: unknown): unknown {
  if (typeof value === "function") return "[function]";
  if (typeof value === "symbol") return String(value);
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(normalizeEntryKeyValue);

  const record = value as Record<string, unknown>;
  return Object.keys(record).sort().reduce<Record<string, unknown>>((result, key) => {
    const normalized = normalizeEntryKeyValue(record[key]);
    if (normalized !== undefined) {
      result[key] = normalized;
    }
    return result;
  }, {});
}

function stableEntryStringify(value: unknown): string {
  return JSON.stringify(normalizeEntryKeyValue(value));
}

function createEntryAnimationKey(option: EChartsOption): string {
  return stableEntryStringify(option);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readDatumValue(datum: unknown): number | null {
  if (isFiniteNumber(datum)) return datum;
  if (!datum || typeof datum !== "object") return null;

  const value = (datum as Record<string, unknown>).value;
  if (isFiniteNumber(value)) return value;
  if (Array.isArray(value)) return value.find(isFiniteNumber) ?? null;
  return null;
}

function readSeriesValues(series: Record<string, unknown>): number[] {
  const data = series.data;
  if (!Array.isArray(data)) return [];
  return data.map(readDatumValue).filter(isFiniteNumber);
}

function readLegendItemName(item: unknown): string | null {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return null;

  const name = (item as Record<string, unknown>).name;
  return typeof name === "string" ? name : null;
}

function getSeriesList(option: EChartsOption): unknown[] {
  const sourceSeries = option.series;
  return Array.isArray(sourceSeries) ? sourceSeries : sourceSeries ? [sourceSeries] : [];
}

function isItemLegendSeries(current: Record<string, unknown>): boolean {
  return current.type === "pie" || current.type === "funnel";
}

function isSelectAllLegendSeries(series: unknown): boolean {
  return Boolean(series && typeof series === "object" && (series as Record<string, unknown>).id === SELECT_ALL_LEGEND_SERIES_ID);
}

function getDataItemLegendNames(series: Record<string, unknown>): string[] {
  if (!isItemLegendSeries(series) || !Array.isArray(series.data)) return [];
  return series.data.map(readLegendItemName).filter((name): name is string => Boolean(name));
}

function isReferenceLegendSeries(series: Record<string, unknown>): boolean {
  const lineStyle = series.lineStyle as Record<string, unknown> | undefined;
  if (series.type !== "line" || lineStyle?.type !== "dashed") return false;

  const values = readSeriesValues(series);
  return values.length > 1 && values.every((value) => value === values[0]);
}

function getLegendDisplayNames(option: EChartsOption): string[] {
  const names = new Set<string>();

  for (const series of getSeriesList(option)) {
    if (!series || typeof series !== "object" || isSelectAllLegendSeries(series)) continue;

    const current = series as Record<string, unknown>;
    if (typeof current.name === "string") {
      names.add(current.name);
    }

    for (const name of getDataItemLegendNames(current)) {
      names.add(name);
    }
  }

  return [...names];
}

function getSelectableLegendNames(option: EChartsOption): string[] {
  const names = new Set<string>();

  for (const series of getSeriesList(option)) {
    if (!series || typeof series !== "object" || isSelectAllLegendSeries(series)) continue;

    const current = series as Record<string, unknown>;
    if (isReferenceLegendSeries(current)) continue;

    const dataItemNames = getDataItemLegendNames(current);
    if (dataItemNames.length > 0) {
      for (const name of dataItemNames) {
        names.add(name);
      }
      continue;
    }

    if (typeof current.name === "string") {
      names.add(current.name);
    }
  }

  return [...names];
}

function isControlLegendClick(params: LegendSelectChangedParams, modifier?: PointerModifier | null): boolean {
  const nativeEvent = params.event?.event ?? params.event;
  const recentModifier =
    modifier && Date.now() - modifier.timestamp < 1200 ? modifier : undefined;

  return Boolean(nativeEvent?.ctrlKey || nativeEvent?.metaKey || recentModifier?.ctrlKey || recentModifier?.metaKey);
}

function createSelectAllSelection(
  option: EChartsOption,
  params: LegendSelectChangedParams
): Record<string, boolean> | undefined {
  if (!params.selected) return params.selected;

  const selectableNames = getSelectableLegendNames(option);
  const allSelected = Object.fromEntries(
    selectableNames.map((name) => [name, true])
  );

  return { ...params.selected, ...allSelected, [SELECT_ALL_LEGEND_NAME]: true };
}

function createLegendSelection(
  option: EChartsOption,
  params: LegendSelectChangedParams,
  modifier?: PointerModifier | null
): Record<string, boolean> | undefined {
  if (!params.selected || !params.name) return params.selected;
  if (params.name === SELECT_ALL_LEGEND_NAME) return createSelectAllSelection(option, params);
  if (!isControlLegendClick(params, modifier)) return params.selected;

  const selectableNames = getSelectableLegendNames(option);
  if (!selectableNames.includes(params.name)) return params.selected;

  const isolatedSelection = Object.fromEntries(
    selectableNames.map((name) => [name, name === params.name])
  );

  return { ...params.selected, ...isolatedSelection };
}

function shouldShowSelectAllLegend(option: EChartsOption, legendSelection?: Record<string, boolean>): boolean {
  if (!legendSelection) return false;

  const selectableNames = getSelectableLegendNames(option);
  return selectableNames.some((name) => legendSelection?.[name] === false);
}

function readLegendData(data: unknown, fallbackLegendData: string[]): string[] {
  const sourceData = Array.isArray(data) && data.length > 0
    ? data.map(readLegendItemName).filter((name): name is string => Boolean(name))
    : fallbackLegendData;

  return sourceData.filter((name) => name !== SELECT_ALL_LEGEND_NAME);
}

function makeSelectAllLegendSeries(): Record<string, unknown> {
  return {
    id: SELECT_ALL_LEGEND_SERIES_ID,
    name: SELECT_ALL_LEGEND_NAME,
    type: "pie",
    radius: 0,
    center: ["-100%", "-100%"],
    data: [],
    itemStyle: { color: "#505AAC" },
    label: { show: false },
    tooltip: { show: false },
    silent: true,
    legendHoverLink: false,
    emphasis: { disabled: true },
    animation: false
  };
}

function withSelectAllLegendOption(option: EChartsOption, legendSelection?: Record<string, boolean>): EChartsOption {
  if (!shouldShowSelectAllLegend(option, legendSelection)) return option;

  const fallbackLegendData = getLegendDisplayNames(option);
  if (fallbackLegendData.length === 0) return option;

  const addSelectAllToLegend = (legend: unknown) => {
    if (!legend || typeof legend !== "object") {
      const legendData = fallbackLegendData;
      return { data: [SELECT_ALL_LEGEND_NAME, ...legendData] };
    }

    const record = legend as Record<string, unknown>;
    const legendData = readLegendData(record.data, fallbackLegendData);
    return {
      ...record,
      data: [SELECT_ALL_LEGEND_NAME, ...legendData]
    };
  };

  const sourceSeries = getSeriesList(option).filter((series) => !isSelectAllLegendSeries(series));
  const nextSeries = sourceSeries.length > 0 ? sourceSeries : [];

  return {
    ...option,
    legend: Array.isArray(option.legend)
      ? option.legend.map(addSelectAllToLegend)
      : addSelectAllToLegend(option.legend),
    series: [makeSelectAllLegendSeries(), ...nextSeries]
  } as EChartsOption;
}

type BaseChartProps = {
  option: EChartsOption;
  className?: "small" | "tall" | "spark";
  empty?: boolean;
  emptyLabel?: string;
  entryAnimationKey?: unknown;
  style?: CSSProperties;
};

export function BaseChart({
  option,
  className,
  empty = false,
  emptyLabel = "No data for the selected filters.",
  entryAnimationKey,
  style
}: BaseChartProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const entryFrameRef = useRef<number[]>([]);
  const optionRef = useRef(option);
  const lastEntryAnimationKeyRef = useRef<unknown>(INITIAL_ENTRY_ANIMATION_KEY);
  const mergedOption = useMemo(() => withChartDefaults(option), [option]);
  const resolvedEntryAnimationKey = entryAnimationKey ?? createEntryAnimationKey(mergedOption);

  useEffect(() => {
    optionRef.current = option;
  }, [option]);

  useEffect(() => {
    if (!ref.current || empty) return undefined;
    const entryFrameIds = entryFrameRef.current;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    lastEntryAnimationKeyRef.current = INITIAL_ENTRY_ANIMATION_KEY;
    let lastLegendPointerModifier: PointerModifier | null = null;

    const handleLegendPointerEvent = (event: unknown) => {
      const nativeEvent = (event as ZrPointerEvent).event;
      lastLegendPointerModifier = {
        ctrlKey: Boolean(nativeEvent?.ctrlKey),
        metaKey: Boolean(nativeEvent?.metaKey),
        timestamp: Date.now()
      };
    };
    const handleLegendSelection = (event: unknown) => {
      const params = event as LegendSelectChangedParams;
      if (!params.selected) return;

      const selected = createLegendSelection(optionRef.current, params, lastLegendPointerModifier);
      const visibleOption = withSelectAllLegendOption(optionRef.current, selected);
      const nextOption = withChartDefaults(visibleOption, selected);
      chart.setOption(nextOption, LEGEND_SET_OPTION_OPTIONS);
    };
    const resize = () => chart.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(ref.current);
    chart.getZr().on("mousedown", handleLegendPointerEvent);
    chart.on("legendselectchanged", handleLegendSelection);
    window.addEventListener("resize", resize);

    return () => {
      cancelEntryFrames(entryFrameIds);
      chart.getZr().off("mousedown", handleLegendPointerEvent);
      chart.off("legendselectchanged", handleLegendSelection);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
      lastEntryAnimationKeyRef.current = INITIAL_ENTRY_ANIMATION_KEY;
    };
  }, [empty]);

  useEffect(() => {
    if (!chartRef.current || empty) return;
    if (lastEntryAnimationKeyRef.current !== resolvedEntryAnimationKey) {
      lastEntryAnimationKeyRef.current = resolvedEntryAnimationKey;
      playEntryAnimation(chartRef.current, mergedOption, entryFrameRef.current);
      return;
    }
  }, [empty, mergedOption, resolvedEntryAnimationKey]);

  if (empty) {
    return <div className="empty-state">{emptyLabel}</div>;
  }

  return (
    <div className={["chart-frame", className].filter(Boolean).join(" ")} style={{ ...style, position: "relative" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

