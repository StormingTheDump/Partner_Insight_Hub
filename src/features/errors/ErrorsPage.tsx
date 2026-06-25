import * as echarts from "echarts";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import type { PageProps } from "@/dashboard/routes";
import { withChartDefaults, withChartEntryInitialState } from "@/shared/charts/chart-theme";
import { ChartCard } from "@/shared/components/ChartCard";
import { PageHeader } from "@/shared/components/PageHeader";
import "./ErrorsPage.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const PAGE_SIZE = 15;
const SET_OPTION_OPTIONS = { notMerge: true, lazyUpdate: false };

// ── 类型 ────────────────────────────────────────────────────────
type ChartItem  = { error_type: string; count: number };
type PreRow     = { log_time: string; client_id: string; dida_rate_plan_id: string; dida_hotel_id: number; error_type: string; rate_record_channel: string };
type BookRow    = { channel_createtime: string; client_id: string; channel_bookingnumber: string; dida_hotel_id: number; error_type: string };
type Meta       = { channels: string[]; error_types: string[] };
type DateRange  = [string, string] | null;

// ── 图表（水平柱状图，复用原有样式）────────────────────────────
const axisText = { color: "#475569", fontSize: 11 };

function horizBarOption(data: ChartItem[]): EChartsOption {
  const names  = data.map((d) => d.error_type);
  const values = data.map((d) => d.count);
  const max    = Math.max(...values, 1);
  return {
    grid: { left: 160, right: 24, top: 12, bottom: 20, containLabel: false },
    xAxis: {
      type: "value",
      max,
      axisLabel: axisText,
      splitLine: { lineStyle: { color: "#E5E7EB", type: "dashed" } },
    },
    yAxis: {
      type: "category",
      data: names,
      axisLabel: { ...axisText, width: 148, overflow: "truncate" },
      inverse: true,
    },
    legend: { show: false },
    series: [{
      type: "bar",
      data: values,
      barWidth: 28,
      itemStyle: { color: "#4F5AAB", borderRadius: 4 },
      label: { show: true, position: "right", color: "#475569", fontSize: 11, formatter: "{c}" },
    }],
  };
}

// ── 动态高度图表（按条目数自动伸缩）────────────────────────────
const PER_BAR = 52;  // 28px bar + ~24px gap
const CHART_PADDING = 44;  // grid top(12) + bottom(20) + 12 extra

function DynChart({ data }: { data: ChartItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const entryFrameRef = useRef<number[]>([]);
  const height = data.length > 0 ? Math.max(220, data.length * PER_BAR + CHART_PADDING) : 220;

  const cancelEntryFrames = useCallback(() => {
    entryFrameRef.current.forEach((id) => window.cancelAnimationFrame(id));
    entryFrameRef.current.length = 0;
  }, []);

  const playEntryAnimation = useCallback((nextOption: EChartsOption) => {
    if (!chartRef.current) return;
    cancelEntryFrames();
    chartRef.current.setOption(withChartEntryInitialState(nextOption), SET_OPTION_OPTIONS);

    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => {
        chartRef.current?.setOption(nextOption, SET_OPTION_OPTIONS);
        entryFrameRef.current.length = 0;
      });
      entryFrameRef.current.push(secondFrame);
    });
    entryFrameRef.current.push(firstFrame);
  }, [cancelEntryFrames]);

  // 初始化一次，生命周期与 DOM 节点绑定
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => { cancelEntryFrames(); ro.disconnect(); chart.dispose(); chartRef.current = null; };
  }, [cancelEntryFrames]);

  // 数据变化时更新 option 和容器高度
  useEffect(() => {
    if (!chartRef.current) return;
    if (data.length === 0) { cancelEntryFrames(); chartRef.current.clear(); return; }
    const nextOption = withChartDefaults(horizBarOption(data));
    playEntryAnimation(nextOption);
    // DOM 高度已由 React 更新，通知 ECharts 重新适配
    requestAnimationFrame(() => chartRef.current?.resize());
  }, [data, cancelEntryFrames, playEntryAnimation]);

  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      {data.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#b0bac8" }}>
          暂无数据
        </div>
      )}
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

// ── JSON 弹窗 ────────────────────────────────────────────────────
type LogObj = {
  log_type: string;
  log_time?: string;
  log_detail: {
    request:  Record<string, unknown>;
    response: Record<string, unknown>;
  };
};

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre style={{
      margin: 0, fontSize: 10.5,
      fontFamily: "var(--font-mono)",
      background: "#0f172a", color: "#e2e8f0",
      padding: "10px 12px", borderRadius: 6,
      overflow: "auto", maxHeight: 260,
      lineHeight: 1.6, whiteSpace: "pre",
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

const toggleBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  background: "none", border: "none", cursor: "pointer",
  padding: "0 0 6px", color: "#475569",
};

function LogPanel({ log }: { log: LogObj }) {
  const [reqOpen, setReqOpen] = useState(true);
  const [resOpen, setResOpen] = useState(true);

  const resp    = log.log_detail.response;
  const respKey = Object.keys(resp).find(k => k !== "Header") ?? "";
  const respBody = (resp[respKey] ?? {}) as Record<string, unknown>;
  const status   = String(respBody["Status"] ?? "");
  const errCode  = String(respBody["ErrorCode"] ?? "");

  return (
    <div style={{ border: "1px solid #fda4af", borderRadius: 8, overflow: "hidden" }}>
      {/* section header */}
      <div style={{
        background: "#fff1f2", borderBottom: "1px solid #fda4af",
        padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 800,
            background: "#EF444420", color: "#EF4444",
          }}>
            验价报错
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444" }}>
            {log.log_type === "price_check" ? "HotelPriceCheck" : log.log_type}
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>{log.log_time ?? ""}</span>
      </div>

      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Request */}
        <div>
          <button type="button" onClick={() => setReqOpen(o => !o)} style={toggleBtn}>
            {reqOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>REQUEST</span>
          </button>
          {reqOpen && <JsonBlock data={log.log_detail.request} />}
        </div>

        {/* Response */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <button type="button" onClick={() => setResOpen(o => !o)} style={toggleBtn}>
              {resOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>RESPONSE</span>
            </button>
            {status === "Error" && (
              <span className="status danger" style={{ fontSize: 11 }}>{errCode || "Error"}</span>
            )}
            {status === "Success" && (
              <span className="status" style={{ fontSize: 11 }}>Success</span>
            )}
          </div>
          {resOpen && <JsonBlock data={log.log_detail.response} />}
        </div>
      </div>
    </div>
  );
}

function JsonModal({ raw, onClose }: { raw: string; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  let logObj: LogObj | null = null;
  let pretty = raw;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.log_type && parsed.log_detail) {
      logObj = parsed as unknown as LogObj;
    } else {
      pretty = JSON.stringify(parsed, null, 2);
    }
  } catch { /* keep as string */ }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 10, width: "min(860px, 90vw)",
        maxHeight: "80vh", display: "flex", flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid #E5E7EB",
        }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#2c3e50" }}>验价错误日志明细</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: logObj ? "14px 16px" : 0 }}>
          {logObj ? (
            <LogPanel log={logObj} />
          ) : (
            <pre style={{
              margin: 0, padding: "16px 20px",
              fontSize: 12, lineHeight: 1.6, color: "#334155",
              fontFamily: "var(--font-mono)",
              background: "#f8fafc", borderRadius: "0 0 10px 10px",
              whiteSpace: "pre-wrap", wordBreak: "break-all",
            }}>
              {pretty}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 分页条 ───────────────────────────────────────────────────────
function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 16, justifyContent: "flex-end" }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="button">‹</button>
      {pages.map((p, i) =>
        p === "..." ? <span key={i} style={{ color: "var(--muted)", padding: "0 4px" }}>…</span>
          : <button key={p} onClick={() => onChange(p as number)} className={`button${p === page ? " primary" : ""}`}>{p}</button>
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="button">›</button>
      <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 6 }}>共 {total} 条</span>
    </div>
  );
}

function parseMultiValueInput(value: string) {
  const seen = new Set<string>();
  return value
    .split(/[\s,，]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function applyDateRange(params: URLSearchParams, dateRange: DateRange) {
  if (!dateRange) return;
  params.set("start_date", dateRange[0]);
  params.set("end_date", dateRange[1]);
}

function MultiSelectFilter({
  options,
  selectedErrorTypes,
  onChange,
}: {
  options: string[];
  selectedErrorTypes: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const label =
    selectedErrorTypes.length === 0
      ? "全部类型"
      : selectedErrorTypes.length === 1
        ? selectedErrorTypes[0]
        : `已选 ${selectedErrorTypes.length} 类`;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const toggle = (option: string) => {
    onChange(
      selectedErrorTypes.includes(option)
        ? selectedErrorTypes.filter((item) => item !== option)
        : [...selectedErrorTypes, option]
    );
  };

  return (
    <div className="errors-multi-select" ref={boxRef}>
      <button
        aria-expanded={open}
        className="filter-control errors-multi-select-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>{label}</span>
        <ChevronDown size={14} />
      </button>

      {open ? (
        <div className="errors-multi-select-menu">
          {options.map((option) => (
            <label className="errors-multi-select-option" key={option}>
              <input
                checked={selectedErrorTypes.includes(option)}
                onChange={() => toggle(option)}
                type="checkbox"
              />
              <span>{option}</span>
            </label>
          ))}
          <button className="errors-multi-select-clear" onClick={() => onChange([])} type="button">
            清空选择
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ── 验价报错 Tab ─────────────────────────────────────────────────
function PrebookTab({ meta, selectedFeed, dateRange }: { meta: Meta; selectedFeed: string; dateRange?: DateRange }) {
  const [selectedErrorTypes, setSelectedErrorTypes] = useState<string[]>([]);
  const [ratePlanId,  setRatePlanId]  = useState("");
  const [applied,     setApplied]     = useState({ errorTypes: [] as string[], ratePlanIds: [] as string[] });
  const [chart,       setChart]       = useState<ChartItem[]>([]);
  const [rows,        setRows]        = useState<PreRow[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [modal,       setModal]       = useState<string | null>(null);

  const clientId = selectedFeed !== "全部渠道" ? selectedFeed : "";

  const fetch_ = (p: number, filters = applied) => {
    setLoading(true);
    const params = new URLSearchParams({ client_id: clientId, page: String(p), page_size: String(PAGE_SIZE) });
    if (filters.errorTypes.length > 0) params.set("error_types", filters.errorTypes.join(","));
    if (filters.ratePlanIds.length > 0) params.set("rate_plan_ids", filters.ratePlanIds.join(","));
    applyDateRange(params, dateRange ?? null);
    fetch(`${API_BASE}/api/errors/prebook?${params}`)
      .then((r) => r.json())
      .then((d) => { setChart(d.chart); setRows(d.rows); setTotal(d.total); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch_(1);
  }, [clientId, dateRange?.[0], dateRange?.[1]]);

  const applyPrebookFilters = (nextErrorTypes: string[], nextRatePlanId: string) => {
    const filters = { errorTypes: nextErrorTypes, ratePlanIds: parseMultiValueInput(nextRatePlanId) };
    setApplied(filters);
    fetch_(1, filters);
  };

  return (
    <>
      {/* 筛选器 */}
      <div className="filter-row">
        <MultiSelectFilter
          onChange={(next) => {
            setSelectedErrorTypes(next);
            applyPrebookFilters(next, ratePlanId);
          }}
          options={meta.error_types}
          selectedErrorTypes={selectedErrorTypes}
        />
        <label className="errors-multi-value-control">
          <Search className="errors-multi-value-icon" size={14} />
          <textarea
            className="errors-multi-value-input"
            value={ratePlanId}
            onChange={(e) => {
              setRatePlanId(e.target.value);
              applyPrebookFilters(selectedErrorTypes, e.target.value);
            }}
            placeholder="Rate Plan ID"
          />
        </label>
      </div>

      {/* 图表 */}
      <ChartCard title="按错误类型分布" subtitle="当前筛选范围内各错误类型出现次数">
        <DynChart data={chart} />
      </ChartCard>

      {/* 表格 */}
      <div style={{ marginTop: 22 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["时间", "渠道", "错误类型", "Hotel ID", "Rate Plan ID", "日志明细"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#b0bac8" }}>加载中…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#b0bac8" }}>无匹配记录</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{r.log_time?.replace("T", " ").substring(0, 19)}</td>
                  <td style={tdStyle}>{r.client_id}</td>
                  <td style={tdStyle}><span className="status danger">{r.error_type}</span></td>
                  <td style={tdStyle}>{r.dida_hotel_id}</td>
                  <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.dida_rate_plan_id}</td>
                  <td style={tdStyle}>
                    <button onClick={() => {
                      let rrc: unknown = r.rate_record_channel ?? null;
                      try { rrc = JSON.parse(rrc as string); } catch { /* keep as string */ }
                      setModal(JSON.stringify(rrc, null, 2));
                    }} className="button" style={{ minHeight: 28, padding: "0 10px", fontSize: 12 }}>查看</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => fetch_(p)} />
      </div>

      {modal && <JsonModal raw={modal} onClose={() => setModal(null)} />}
    </>
  );
}

// ── 下单报错 Tab ─────────────────────────────────────────────────
function BookTab({ meta, selectedFeed, dateRange }: { meta: Meta; selectedFeed: string; dateRange?: DateRange }) {
  const [selectedErrorTypes, setSelectedErrorTypes] = useState<string[]>([]);
  const [bookingNumber, setBookingNumber] = useState("");
  const [applied,       setApplied]       = useState({ errorTypes: [] as string[], bookingNumbers: [] as string[] });
  const [chart,         setChart]         = useState<ChartItem[]>([]);
  const [rows,          setRows]          = useState<BookRow[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(false);

  const clientId = selectedFeed !== "全部渠道" ? selectedFeed : "";

  const fetch_ = (p: number, filters = applied) => {
    setLoading(true);
    const params = new URLSearchParams({ client_id: clientId, page: String(p), page_size: String(PAGE_SIZE) });
    if (filters.errorTypes.length > 0) params.set("error_types", filters.errorTypes.join(","));
    if (filters.bookingNumbers.length > 0) params.set("booking_numbers", filters.bookingNumbers.join(","));
    applyDateRange(params, dateRange ?? null);
    fetch(`${API_BASE}/api/errors/book?${params}`)
      .then((r) => r.json())
      .then((d) => { setChart(d.chart); setRows(d.rows); setTotal(d.total); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch_(1);
  }, [clientId, dateRange?.[0], dateRange?.[1]]);

  const applyBookFilters = (nextErrorTypes: string[], nextBookingNumber: string) => {
    const filters = { errorTypes: nextErrorTypes, bookingNumbers: parseMultiValueInput(nextBookingNumber) };
    setApplied(filters);
    fetch_(1, filters);
  };

  return (
    <>
      {/* 筛选器 */}
      <div className="filter-row">
        <MultiSelectFilter
          onChange={(next) => {
            setSelectedErrorTypes(next);
            applyBookFilters(next, bookingNumber);
          }}
          options={meta.error_types}
          selectedErrorTypes={selectedErrorTypes}
        />
        <label className="errors-multi-value-control">
          <Search className="errors-multi-value-icon" size={14} />
          <textarea
            className="errors-multi-value-input"
            value={bookingNumber}
            onChange={(e) => {
              setBookingNumber(e.target.value);
              applyBookFilters(selectedErrorTypes, e.target.value);
            }}
            placeholder="Dida Booking Number"
          />
        </label>
      </div>

      {/* 图表 */}
      <ChartCard title="按错误类型分布" subtitle="当前筛选范围内各错误类型出现次数">
        <DynChart data={chart} />
      </ChartCard>

      {/* 表格 */}
      <div style={{ marginTop: 22 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["时间", "渠道", "错误类型", "Hotel ID", "Dida Booking Number"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#b0bac8" }}>加载中…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#b0bac8" }}>无匹配记录</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{r.channel_createtime?.substring(0, 19)}</td>
                  <td style={tdStyle}>{r.client_id}</td>
                  <td style={tdStyle}><span className="status danger">{r.error_type}</span></td>
                  <td style={tdStyle}>{r.dida_hotel_id}</td>
                  <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.channel_bookingnumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={(p) => fetch_(p)} />
      </div>
    </>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────
export function ErrorsPage({ selectedFeed, dateRange }: PageProps) {
  const [tab,  setTab]  = useState<"prebook" | "book">("prebook");
  const [meta, setMeta] = useState<{ prebook: Meta; book: Meta } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/errors/meta`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  return (
    <div className="errors-page">
      <PageHeader
        title="错误日志"
        description="过去 48 小时内验价及下单报错记录，支持错误类型筛选。"
      />

      {/* Tab 切换 */}
      <div style={{ display: "flex", gap: 0, marginTop: 20, borderBottom: "2px solid var(--line-soft)" }}>
        {(["prebook", "book"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 24px",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--pih-primary)" : "2px solid transparent",
              marginBottom: -2,
              background: "none",
              color: tab === t ? "var(--pih-primary)" : "var(--muted)",
              fontWeight: tab === t ? 600 : 400,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t === "prebook" ? "验价报错" : "下单报错"}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        {!meta ? (
          <div style={{ textAlign: "center", padding: 48, color: "#b0bac8" }}>加载中…</div>
        ) : tab === "prebook" ? (
          <PrebookTab dateRange={dateRange} meta={meta.prebook} selectedFeed={selectedFeed} />
        ) : (
          <BookTab dateRange={dateRange} meta={meta.book} selectedFeed={selectedFeed} />
        )}
      </div>
    </div>
  );
}

// ── 样式常量 ──────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 2,
  background: "#F8FAFC", color: "#475569",
  fontSize: 12, fontWeight: 800,
  padding: "11px 13px",
  borderBottom: "2px solid var(--line)",
  whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left",
};
const tdStyle: React.CSSProperties = {
  padding: "11px 13px", borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle", textAlign: "left", whiteSpace: "nowrap",
};
