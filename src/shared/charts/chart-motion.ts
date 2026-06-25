import type { EChartsOption } from "echarts";

type AxisExtent = { min: number; max: number };
type ChartRecord = Record<string, unknown>;
export type LegendSelection = Record<string, boolean>;

export const BAR_STAGGER = 22;
export const PIE_STAGGER = 36;
const DEFAULT_CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];
const KNOT_LAYER_ROLE = "__chartKnotLayer";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function restoreShape<T>(original: T | T[] | undefined, mapped: T[]): T | T[] | undefined {
  if (original === undefined) return undefined;
  return Array.isArray(original) ? mapped : mapped[0];
}

function restoreSeriesShape<T>(original: T | T[] | undefined, mapped: T[]): T | T[] | undefined {
  if (original === undefined) return undefined;
  return Array.isArray(original) || mapped.length !== 1 ? mapped : mapped[0];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readDatumValue(datum: unknown): number | null {
  if (isFiniteNumber(datum)) return datum;
  if (!datum || typeof datum !== "object") return null;

  const value = (datum as ChartRecord).value;
  if (isFiniteNumber(value)) return value;
  if (Array.isArray(value)) {
    const firstNumber = value.find(isFiniteNumber);
    return firstNumber ?? null;
  }

  return null;
}

function readSeriesValues(series: ChartRecord): number[] {
  const data = series.data;
  if (!Array.isArray(data)) return [];
  return data.map(readDatumValue).filter(isFiniteNumber);
}

function niceStep(span: number): number {
  const safeSpan = Math.max(Math.abs(span), 1);
  const rough = safeSpan / 5;
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const scaled = rough / power;

  if (scaled <= 1) return power;
  if (scaled <= 2) return 2 * power;
  if (scaled <= 5) return 5 * power;
  return 10 * power;
}

export function dynamicAxisMin({ min, max }: AxisExtent): number {
  if (!isFiniteNumber(min) || !isFiniteNumber(max)) return 0;

  const span = Math.max(max - min, Math.abs(max) || 1);
  const padding = span * 0.12;
  const rawMin = min - padding;
  const step = niceStep(span);

  if (min >= 0 && rawMin < 0) return 0;
  return Math.floor(rawMin / step) * step;
}

export function dynamicAxisMax({ min, max }: AxisExtent): number {
  if (!isFiniteNumber(min) || !isFiniteNumber(max)) return 1;

  const span = Math.max(max - min, Math.abs(max) || 1);
  const padding = span * 0.12;
  const step = niceStep(span);

  return Math.ceil((max + padding) / step) * step;
}

export function isPercentAxis(axis: ChartRecord): boolean {
  const axisLabel = axis.axisLabel as ChartRecord | undefined;
  const formatter = axisLabel?.formatter;
  const name = axis.name;

  if (typeof name === "string" && name.includes("%")) return true;
  if (typeof formatter === "string" && formatter.includes("%")) return true;
  if (typeof formatter === "function" && formatter.toString().includes("%")) return true;
  return axis.min === 0 && axis.max === 100;
}

export function isDynamicValueAxis(axis: ChartRecord): boolean {
  const inferredType = axis.type ?? (axis.data ? "category" : "value");
  return inferredType === "value" && !isPercentAxis(axis);
}

function isDashedLineSeries(series: ChartRecord): boolean {
  const lineStyle = series.lineStyle as ChartRecord | undefined;
  return series.type === "line" && lineStyle?.type === "dashed";
}

function isAreaLineSeries(series: ChartRecord): boolean {
  return series.type === "line" && Boolean(series.areaStyle);
}

export function isReferenceLineSeries(series: ChartRecord): boolean {
  if (!isDashedLineSeries(series)) return false;

  const values = readSeriesValues(series);
  return values.length > 1 && values.every((value) => value === values[0]);
}

export function isBusinessLineSeries(series: ChartRecord): boolean {
  return isKnotEligibleLineSeries(series);
}

function isKnotEligibleLineSeries(series: ChartRecord): boolean {
  return series.type === "line" && !isDashedLineSeries(series) && !isAreaLineSeries(series);
}

function isSeriesLegendSelected(series: ChartRecord, selected?: LegendSelection): boolean {
  if (!selected || typeof series.name !== "string") return true;
  return selected?.[String(series.name)] !== false;
}

export function collectAxisExtent(
  seriesList: unknown[],
  axisIndex: number,
  legendSelection?: LegendSelection
): AxisExtent | null {
  const values: number[] = [];
  const stackBuckets = new Map<string, number[]>();

  for (const series of seriesList) {
    if (!series || typeof series !== "object") continue;

    const current = series as ChartRecord;
    if (!isSeriesLegendSelected(current, legendSelection)) continue;
    if (isReferenceLineSeries(current)) continue;

    const yAxisIndex = isFiniteNumber(current.yAxisIndex) ? current.yAxisIndex : 0;
    if (yAxisIndex !== axisIndex) continue;

    const seriesValues = readSeriesValues(current);
    if (seriesValues.length === 0) continue;

    if (current.type === "bar" && current.stack) {
      const stackKey = String(current.stack);
      const bucket = stackBuckets.get(stackKey) ?? [];
      seriesValues.forEach((value, dataIndex) => {
        bucket[dataIndex] = (bucket[dataIndex] ?? 0) + value;
      });
      stackBuckets.set(stackKey, bucket);
      continue;
    }

    values.push(...seriesValues);
  }

  for (const bucket of stackBuckets.values()) {
    values.push(...bucket.filter(isFiniteNumber));
  }

  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

function withDynamicValueAxis(axis: unknown, extent: AxisExtent | null): unknown {
  if (!axis || typeof axis !== "object" || !isDynamicValueAxis(axis as ChartRecord)) {
    return axis;
  }

  if (extent) {
    return {
      ...(axis as ChartRecord),
      scale: true,
      min: dynamicAxisMin(extent),
      max: dynamicAxisMax(extent)
    };
  }

  return {
    ...(axis as ChartRecord),
    scale: true,
    min: dynamicAxisMin,
    max: dynamicAxisMax
  };
}

function getSeriesColor(series: ChartRecord, fallbackColor: string): unknown {
  const itemStyle = series.itemStyle as ChartRecord | undefined;
  const lineStyle = series.lineStyle as ChartRecord | undefined;
  return itemStyle?.color ?? lineStyle?.color ?? fallbackColor;
}

function getKnotCoordinateSystem(series: ChartRecord): ChartRecord {
  const coordinateSystem = series.coordinateSystem;
  if (coordinateSystem === "cartesian2d" || coordinateSystem === "polar") {
    return { coordinateSystem };
  }
  return {};
}

function getSeriesLayerId(series: ChartRecord, seriesIndex: number, role: "line" | "knot"): string {
  const sourceId = series.id;
  const stableKey =
    typeof sourceId === "string" || typeof sourceId === "number"
      ? sourceId
      : `${seriesIndex}-${String(series.name ?? "series")}`;
  return `${stableKey}-${role}`;
}

function zeroDatumValue(datum: unknown): unknown {
  if (isFiniteNumber(datum)) return 0;
  if (!datum || typeof datum !== "object") return datum;

  const record = datum as ChartRecord;
  const value = record.value;
  if (isFiniteNumber(value)) {
    return { ...record, value: 0 };
  }

  if (Array.isArray(value)) {
    const nextValue = [...value];
    for (let i = nextValue.length - 1; i >= 0; i -= 1) {
      if (isFiniteNumber(nextValue[i])) {
        nextValue[i] = 0;
        break;
      }
    }
    return { ...record, value: nextValue };
  }

  return record;
}

function zeroedSeriesData(data: unknown): unknown {
  return Array.isArray(data) ? data.map(zeroDatumValue) : data;
}

function withLineDrawingMotion(series: ChartRecord, seriesIndex: number, fallbackColor: string): ChartRecord {
  const itemStyle = series.itemStyle as ChartRecord | undefined;
  const lineStyle = series.lineStyle as ChartRecord | undefined;
  return {
    ...series,
    id: getSeriesLayerId(series, seriesIndex, "line"),
    itemStyle: { ...itemStyle, color: itemStyle?.color ?? lineStyle?.color ?? fallbackColor },
    lineStyle: { ...lineStyle, color: lineStyle?.color ?? itemStyle?.color ?? fallbackColor },
    showSymbol: false,
    showAllSymbol: false,
    animation: true,
    animationDuration: 960,
    animationDurationUpdate: 620,
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicInOut",
    animationDelay: 0,
    animationDelayUpdate: 0,
    clip: true
  };
}

function makeKnotSeries(series: ChartRecord, seriesIndex: number, hollow: boolean, fallbackColor: string): ChartRecord {
  const color = getSeriesColor(series, fallbackColor);
  const lineStyle = series.lineStyle as ChartRecord | undefined;

  return {
    [KNOT_LAYER_ROLE]: true,
    id: getSeriesLayerId(series, seriesIndex, "knot"),
    name: series.name,
    type: "line",
    data: series.data,
    xAxisIndex: series.xAxisIndex,
    yAxisIndex: series.yAxisIndex,
    ...getKnotCoordinateSystem(series),
    smooth: series.smooth,
    symbol: "circle",
    symbolSize: 7,
    showSymbol: true,
    showAllSymbol: true,
    lineStyle: {
      ...lineStyle,
      color: "transparent",
      opacity: 0,
      width: 0
    },
    itemStyle: {
      color: hollow ? "transparent" : color,
      borderColor: color,
      borderWidth: hollow ? 2 : 0
    },
    z: 30 + seriesIndex,
    silent: true,
    legendHoverLink: false,
    tooltip: { show: false },
    emphasis: { disabled: true },
    animation: false
  };
}

function withSeriesMotion(series: unknown, seriesIndex: number): unknown {
  if (!series || typeof series !== "object") return series;

  const current = series as ChartRecord;

  if (current.type === "bar") {
    return {
      ...current,
      animation: true,
      animationDuration: 760,
      animationDurationUpdate: 520,
      animationEasing: "cubicOut",
      animationEasingUpdate: "cubicOut",
      animationDelay: (dataIndex: number) => dataIndex * BAR_STAGGER + seriesIndex * 45,
      animationDelayUpdate: (dataIndex: number) => dataIndex * 10
    };
  }

  if (current.type === "pie") {
    return {
      ...current,
      animation: true,
      animationType: "expansion",
      animationTypeUpdate: "expansion",
      animationDuration: 820,
      animationDurationUpdate: 540,
      animationEasing: "cubicOut",
      animationEasingUpdate: "cubicOut",
      animationDelay: (dataIndex: number) => dataIndex * PIE_STAGGER
    };
  }

  if (current.type === "funnel") {
    return {
      ...current,
      animation: true,
      animationDuration: 760,
      animationDurationUpdate: 520,
      animationEasing: "cubicOut",
      animationEasingUpdate: "cubicOut",
      animationDelay: (dataIndex: number) => dataIndex * BAR_STAGGER
    };
  }

  return current;
}

function withEntryInitialSeries(series: unknown): unknown[] {
  if (!series || typeof series !== "object") return [series];

  const current = series as ChartRecord;
  if (current[KNOT_LAYER_ROLE]) {
    return [current];
  }

  if (current.type === "line") {
    return [];
  }

  if (current.type === "bar") {
    return [{ ...current, data: zeroedSeriesData(current.data) }];
  }

  if (current.type === "pie" || current.type === "funnel") {
    return [{ ...current, data: [] }];
  }

  return [current];
}

export function withChartEntryInitialState(option: EChartsOption): EChartsOption {
  const series = option.series;
  const sourceSeries = asArray(series) as unknown[];
  const mappedSeries = sourceSeries.flatMap(withEntryInitialSeries);

  return {
    ...option,
    ...(series === undefined ? {} : { series: restoreSeriesShape(series, mappedSeries) })
  } as EChartsOption;
}

export function withInteractiveChartBehavior(option: EChartsOption, legendSelection?: LegendSelection): EChartsOption {
  const series = option.series;
  const yAxis = option.yAxis;
  const sourceSeries = asArray(series) as unknown[];
  const businessLineCount = sourceSeries.filter((item) =>
    item && typeof item === "object" && isKnotEligibleLineSeries(item as ChartRecord)
  ).length;
  const mappedSeries = sourceSeries.flatMap((item, seriesIndex) => {
    if (!item || typeof item !== "object") {
      return [item];
    }

    const current = item as ChartRecord;
    const fallbackColor = DEFAULT_CHART_COLORS[seriesIndex % DEFAULT_CHART_COLORS.length];
    if (current.type === "line") {
      const line = withLineDrawingMotion(current, seriesIndex, fallbackColor);
      if (!isKnotEligibleLineSeries(current)) {
        return [line];
      }

      return [line, makeKnotSeries(current, seriesIndex, businessLineCount > 1, fallbackColor)];
    }

    return [withSeriesMotion(current, seriesIndex)];
  });
  const mappedYAxis = asArray(yAxis).map((axis, axisIndex) =>
    withDynamicValueAxis(axis, collectAxisExtent(sourceSeries, axisIndex, legendSelection))
  );

  return {
    ...option,
    ...(series === undefined ? {} : { series: restoreSeriesShape(series, mappedSeries) }),
    ...(yAxis === undefined ? {} : { yAxis: restoreShape(yAxis, mappedYAxis) })
  } as EChartsOption;
}
