import * as echarts from "echarts";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import type { PageProps } from "@/dashboard/routes";
import { withChartDefaults } from "@/shared/charts/chart-theme";
import { ChartCard } from "@/shared/components/ChartCard";
import { PageHeader } from "@/shared/components/PageHeader";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const PAGE_SIZE = 15;

// ── 类型 ────────────────────────────────────────────────────────
type ChartItem  = { error_type: string; count: number };
type PreRow     = { log_time: string; client_id: string; dida_rate_plan_id: string; dida_hotel_id: number; error_type: string; rate_record_channel: string };
type BookRow    = { channel_createtime: string; client_id: string; channel_bookingnumber: string; dida_hotel_id: number; error_type: string };
type Meta       = { channels: string[]; error_types: string[] };

// ── 图表（水平柱状图，复用原有样式）────────────────────────────
const axisText = { color: "#526078", fontSize: 11 };

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
      splitLine: { lineStyle: { color: "#e8edf4", type: "dashed" } },
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
      itemStyle: { color: "#4c4597", borderRadius: 4 },
      label: { show: true, position: "right", color: "#526078", fontSize: 11, formatter: "{c}" },
    }],
  };
}

// ── 动态高度图表（按条目数自动伸缩）────────────────────────────
const PER_BAR = 52;  // 28px bar + ~24px gap
const CHART_PADDING = 44;  // grid top(12) + bottom(20) + 12 extra

function DynChart({ data }: { data: ChartItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const height = data.length > 0 ? Math.max(220, data.length * PER_BAR + CHART_PADDING) : 220;

  // 初始化一次，生命周期与 DOM 节点绑定
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.dispose(); chartRef.current = null; };
  }, []);

  // 数据变化时更新 option 和容器高度
  useEffect(() => {
    if (!chartRef.current) return;
    if (data.length === 0) { chartRef.current.clear(); return; }
    chartRef.current.setOption(withChartDefaults(horizBarOption(data)), true);
    // DOM 高度已由 React 更新，通知 ECharts 重新适配
    requestAnimationFrame(() => chartRef.current?.resize());
  }, [data]);

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
function JsonModal({ raw, onClose }: { raw: string; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  let pretty = raw;
  try {
    const parsed: unknown = JSON.parse(raw);
    pretty = JSON.stringify(parsed, null, 2);
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #e8edf4" }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#2c3e50" }}>验价错误详情</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <pre style={{
          margin: 0, padding: "16px 20px", overflowY: "auto", flex: 1,
          fontSize: 12, lineHeight: 1.6, color: "#334155",
          fontFamily: "var(--font-mono)",
          background: "#f8fafc", borderRadius: "0 0 10px 10px",
          whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}>
          {pretty}
        </pre>
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

// ── 验价报错 Tab ─────────────────────────────────────────────────
function PrebookTab({ meta }: { meta: Meta }) {
  const [channel,     setChannel]     = useState("");
  const [errorType,   setErrorType]   = useState("");
  const [ratePlanId,  setRatePlanId]  = useState("");
  const [applied,     setApplied]     = useState({ channel: "", errorType: "", ratePlanId: "" });
  const [chart,       setChart]       = useState<ChartItem[]>([]);
  const [rows,        setRows]        = useState<PreRow[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [modal,       setModal]       = useState<string | null>(null);

  const fetch_ = (p: number, filters = applied) => {
    setLoading(true);
    const q = new URLSearchParams({
      client_id:    filters.channel,
      error_type:   filters.errorType,
      rate_plan_id: filters.ratePlanId,
      page:         String(p),
      page_size:    String(PAGE_SIZE),
    });
    fetch(`${API_BASE}/api/errors/prebook?${q}`)
      .then((r) => r.json())
      .then((d) => { setChart(d.chart); setRows(d.rows); setTotal(d.total); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch_(1);
  }, []);

  const search = () => {
    const f = { channel, errorType, ratePlanId };
    setApplied(f);
    fetch_(1, f);
  };

  return (
    <>
      {/* 筛选器 */}
      <div className="filter-row">
        <label className="filter-control">
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">全部渠道</option>
            {meta.channels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <select value={errorType} onChange={(e) => setErrorType(e.target.value)}>
            <option value="">全部类型</option>
            {meta.error_types.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={ratePlanId}
            onChange={(e) => setRatePlanId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Rate Plan ID"
          />
        </label>
        <button onClick={search} className="button primary">
          <Search size={14} /> 搜索
        </button>
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
                {["时间", "渠道", "错误类型", "Hotel ID", "Rate Plan ID", "操作"].map((h) => (
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
                    <button onClick={() => setModal(JSON.stringify({
                      log_time: r.log_time,
                      client_id: r.client_id,
                      error_type: r.error_type,
                      dida_hotel_id: r.dida_hotel_id,
                      dida_rate_plan_id: r.dida_rate_plan_id,
                      rate_record_channel: r.rate_record_channel ?? null,
                    }, null, 2))} className="button" style={{ minHeight: 28, padding: "0 10px", fontSize: 12 }}>查看</button>
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
function BookTab({ meta }: { meta: Meta }) {
  const [channel,       setChannel]       = useState("");
  const [errorType,     setErrorType]     = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [applied,       setApplied]       = useState({ channel: "", errorType: "", bookingNumber: "" });
  const [chart,         setChart]         = useState<ChartItem[]>([]);
  const [rows,          setRows]          = useState<BookRow[]>([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(false);

  const fetch_ = (p: number, filters = applied) => {
    setLoading(true);
    const q = new URLSearchParams({
      client_id:      filters.channel,
      error_type:     filters.errorType,
      booking_number: filters.bookingNumber,
      page:           String(p),
      page_size:      String(PAGE_SIZE),
    });
    fetch(`${API_BASE}/api/errors/book?${q}`)
      .then((r) => r.json())
      .then((d) => { setChart(d.chart); setRows(d.rows); setTotal(d.total); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch_(1);
  }, []);

  const search = () => {
    const f = { channel, errorType, bookingNumber };
    setApplied(f);
    fetch_(1, f);
  };

  return (
    <>
      {/* 筛选器 */}
      <div className="filter-row">
        <label className="filter-control">
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">全部渠道</option>
            {meta.channels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <select value={errorType} onChange={(e) => setErrorType(e.target.value)}>
            <option value="">全部类型</option>
            {meta.error_types.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={bookingNumber}
            onChange={(e) => setBookingNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Dida Booking Number"
          />
        </label>
        <button onClick={search} className="button primary">
          <Search size={14} /> 搜索
        </button>
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
export function ErrorsPage(_: PageProps) {
  const [tab,  setTab]  = useState<"prebook" | "book">("prebook");
  const [meta, setMeta] = useState<{ prebook: Meta; book: Meta } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/errors/meta`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  return (
    <>
      <PageHeader
        title="错误日志"
        description="过去 48 小时内验价及下单报错记录，支持渠道、错误类型筛选。"
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
              borderBottom: tab === t ? "2px solid var(--dida-purple)" : "2px solid transparent",
              marginBottom: -2,
              background: "none",
              color: tab === t ? "var(--dida-purple)" : "var(--muted)",
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
          <PrebookTab meta={meta.prebook} />
        ) : (
          <BookTab meta={meta.book} />
        )}
      </div>
    </>
  );
}

// ── 样式常量 ──────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 2,
  background: "#f8fafd", color: "#526078",
  fontSize: 12, fontWeight: 800,
  padding: "11px 13px",
  borderBottom: "2px solid var(--line)",
  whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left",
};
const tdStyle: React.CSSProperties = {
  padding: "11px 13px", borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle", textAlign: "left", whiteSpace: "nowrap",
};
