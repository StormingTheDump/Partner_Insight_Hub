import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Search, ChevronDown, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { PageProps } from "@/dashboard/routes";
import { PageHeader } from "@/shared/components/PageHeader";
import { Drawer } from "@/shared/components/Drawer";

const API = import.meta.env.VITE_API_BASE ?? "";
const PAGE_SIZE = 20;

type OrderSummary = {
  order_no: string;
  client_id: string;
  order_status: string;
  log_types: string;   // pipe-separated e.g. "price_confirm|booking_confirm|cancel"
  updated_at: string;
};

type LogEntry = {
  log_type: "price_confirm" | "booking_confirm" | "cancel";
  log_detail: { request: Record<string, unknown>; response: Record<string, unknown> };
  updated_at: string;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  confirmed: { label: "已确认", color: "#188038", bg: "#e6f4ea", border: "#c3e6cb" },
  cancelled: { label: "已取消", color: "#935100", bg: "#fff4db", border: "#fde08a" },
  failed:    { label: "失败",   color: "#d93025", bg: "#fce8e6", border: "#f5c6c3" },
};

const STATUS_CLASS: Record<string, string> = {
  confirmed: "status",
  cancelled: "status warning",
  failed:    "status danger",
};

const LOG_META: Record<string, { label: string; apiName: string; color: string; bg: string; border: string }> = {
  price_confirm:   { label: "验价", apiName: "HotelPriceConfirm",   color: "#1a73e8", bg: "#e8f0fe", border: "#bfdbfe" },
  booking_confirm: { label: "下单", apiName: "HotelBookingConfirm",  color: "#188038", bg: "#e6f4ea", border: "#c3e6cb" },
  cancel:          { label: "取消", apiName: "HotelBookingCancel",   color: "#935100", bg: "#fff4db", border: "#fde08a" },
};

const LOG_ORDER: Array<"price_confirm" | "booking_confirm" | "cancel"> =
  ["price_confirm", "booking_confirm", "cancel"];

// ── Main page ────────────────────────────────────────────────────────

export function OrderLogsPage(_: PageProps) {
  const [orders, setOrders]               = useState<OrderSummary[]>([]);
  const [loading, setLoading]             = useState(true);
  const [query, setQuery]                 = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [page, setPage]                   = useState(1);
  const [selected, setSelected]           = useState<OrderSummary | null>(null);
  const [logEntries, setLogEntries]       = useState<LogEntry[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchOrders = useCallback(async (q: string, sf: string) => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q.trim()) p.set("order_no", q.trim());
    if (sf)       p.set("order_status", sf);
    const data: OrderSummary[] = await fetch(`${API}/api/order-logs?${p}`).then(r => r.json());
    setOrders(data);
    setPage(1);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders("", "");
  }, [fetchOrders]);

  const handleSearch = () => fetchOrders(query, statusFilter);
  const handleClear  = () => { setQuery(""); setStatusFilter(""); fetchOrders("", ""); };

  const openDrawer = async (order: OrderSummary) => {
    setSelected(order);
    setDrawerLoading(true);
    const data: LogEntry[] = await fetch(`${API}/api/order-logs/${order.order_no}/detail`).then(r => r.json());
    setLogEntries(data);
    setDrawerLoading(false);
  };

  const downloadCsv = async (order: OrderSummary) => {
    const data: LogEntry[] = await fetch(`${API}/api/order-logs/${order.order_no}/detail`).then(r => r.json());
    const escapeCell = (v: unknown) => `"${JSON.stringify(v).replace(/"/g, '""')}"`;
    const rows = [
      ["订单号", "订单状态", "客户ID", "日志类型", "API名称", "更新时间", "REQUEST", "RESPONSE"],
      ...data.map(e => [
        order.order_no,
        order.order_status,
        order.client_id,
        e.log_type,
        LOG_META[e.log_type]?.apiName ?? e.log_type,
        e.updated_at,
        escapeCell(e.log_detail.request),
        escapeCell(e.log_detail.response),
      ]),
    ];
    const csv = "﻿" + rows.map(r => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${order.order_no}_logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = orders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const statusMeta = (s: string) =>
    STATUS_META[s] ?? { label: s, color: "#6b7280", bg: "#f4f4f5", border: "#d1d5db" };

  return (
    <>
      <PageHeader
        title="订单日志"
        description="按订单号追踪验价、下单及取消全生命周期的 API 请求与响应日志。"
      />

      {/* Search */}
      <div className="filter-row">
        <label className="filter-control">
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="输入订单号搜索，如 ORD202600001"
          />
        </label>
        <label className="filter-control">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="confirmed">已确认</option>
            <option value="cancelled">已取消</option>
            <option value="failed">失败</option>
          </select>
        </label>
        <button type="button" onClick={handleSearch} className="button primary">搜索</button>
        {(query || statusFilter) && (
          <button type="button" onClick={handleClear} className="button">清除</button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          共 <strong>{orders.length}</strong> 条记录
        </span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={th}>订单号</th>
              <th style={th}>订单状态</th>
              <th style={th}>日志类型</th>
              <th style={th}>客户 ID</th>
              <th style={{ ...th, width: 110 }}>更新时间</th>
              <th style={{ ...th, width: 160 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={emptyCell}>加载中…</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={6} style={emptyCell}>未找到订单记录</td></tr>
            ) : pageRows.map((order) => {
              const sm   = statusMeta(order.order_status);
              const types = order.log_types.split("|");
              return (
              <tr key={order.order_no}>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>
                    {order.order_no}
                  </td>
                  <td style={td}>
                    <span className={STATUS_CLASS[order.order_status] ?? "status neutral"}>
                      {sm.label}
                    </span>
                  </td>
                  <td style={td}>
                    <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {LOG_ORDER.filter(t => types.includes(t)).map(t => {
                        const lm = LOG_META[t];
                        return (
                          <span key={t} style={{ padding: "1px 7px", borderRadius: 99, fontSize: 11,
                            fontWeight: 600, background: lm.bg, color: lm.color,
                            border: `1px solid ${lm.border}` }}>
                            {lm.label}
                          </span>
                        );
                      })}
                    </span>
                  </td>
                  <td style={td}>
                    <span className="status info">{order.client_id}</span>
                  </td>
                  <td style={{ ...td, fontSize: 12, color: "var(--muted)" }}>
                    {order.updated_at.split(" ")[0]}
                  </td>
                  <td style={td}>
                    <span style={{ display: "inline-flex", gap: 6 }}>
                      <button type="button" onClick={() => openDrawer(order)} className="button" style={{ height: 28, padding: "0 10px", fontSize: 12 }}>
                        <FileText size={12} /> 详细日志
                      </button>
                      <button type="button" onClick={() => downloadCsv(order)} className="button" style={{ height: 28, padding: "0 10px", fontSize: 12, background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
                        <Download size={12} /> 下载
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1} className="button">上一页</button>
          <span style={{ fontSize: 12, color: "var(--muted)", padding: "0 8px" }}>
            第 {safePage} / {totalPages} 页
          </span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages} className="button">下一页</button>
        </div>
      )}

      {/* Drawer */}
      <Drawer
        open={Boolean(selected)}
        title={selected?.order_no ?? "订单日志"}
        subtitle={selected
          ? `${selected.client_id} · ${statusMeta(selected.order_status).label}`
          : undefined}
        onClose={() => setSelected(null)}
      >
        {drawerLoading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>
            加载中…
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {LOG_ORDER
              .filter(t => logEntries.some(e => e.log_type === t))
              .map(t => {
                const entry = logEntries.find(e => e.log_type === t)!;
                return <LogSection key={t} entry={entry} />;
              })}
          </div>
        )}
      </Drawer>
    </>
  );
}

// ── Log section in drawer ────────────────────────────────────────────

function LogSection({ entry }: { entry: LogEntry }) {
  const [reqOpen, setReqOpen] = useState(true);
  const [resOpen, setResOpen] = useState(true);
  const meta = LOG_META[entry.log_type];

  const resp     = entry.log_detail.response;
  const respKey  = Object.keys(resp).find(k => k !== "Header") ?? "";
  const respBody = (resp[respKey] ?? {}) as Record<string, unknown>;
  const status   = respBody["Status"];

  const statusBadge =
    status === 2 ? { label: "Confirmed", color: "#188038", bg: "#e6f4ea" } :
    status === 3 ? { label: "Canceled",  color: "#935100", bg: "#fff4db" } :
    status === 4 ? { label: "Failed",    color: "#d93025", bg: "#fce8e6" } :
    status === "Success" ? { label: "Success", color: "#188038", bg: "#e6f4ea" } : null;

  return (
    <div style={{ border: `1px solid ${meta.border}`, borderRadius: 8, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: meta.bg, borderBottom: `1px solid ${meta.border}`,
        padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 800,
            background: meta.color + "20", color: meta.color }}>
            {meta.label}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.apiName}</span>
        </div>
        <span style={{ fontSize: 10, color: "var(--muted)" }}>{entry.updated_at}</span>
      </div>

      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Request */}
        <div>
          <button type="button" onClick={() => setReqOpen(o => !o)} style={toggleBtn}>
            {reqOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span style={{ fontSize: 10, fontWeight: 700, color: "#526078",
              textTransform: "uppercase", letterSpacing: "0.5px" }}>REQUEST</span>
          </button>
          {reqOpen && <JsonBlock data={entry.log_detail.request} />}
        </div>

        {/* Response */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <button type="button" onClick={() => setResOpen(o => !o)} style={toggleBtn}>
              {resOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span style={{ fontSize: 10, fontWeight: 700, color: "#526078",
                textTransform: "uppercase", letterSpacing: "0.5px" }}>RESPONSE</span>
            </button>
            {statusBadge && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 99,
                background: statusBadge.bg, color: statusBadge.color }}>
                {statusBadge.label}
              </span>
            )}
          </div>
          {resOpen && <JsonBlock data={entry.log_detail.response} />}
        </div>
      </div>
    </div>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre style={{
      margin: 0, fontSize: 10.5,
      fontFamily: "'Courier New', Courier, monospace",
      background: "#0f172a", color: "#e2e8f0",
      padding: "10px 12px", borderRadius: 6,
      overflow: "auto", maxHeight: 260,
      lineHeight: 1.6, whiteSpace: "pre",
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

const th: CSSProperties = {
  position: "sticky", top: 0, zIndex: 2,
  background: "#f8fafd", color: "#526078",
  fontSize: 12, fontWeight: 800,
  padding: "11px 13px",
  borderBottom: "2px solid var(--line)",
  whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left",
};
const td: CSSProperties = {
  padding: "11px 13px", fontSize: 13, color: "#17213f", borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle", textAlign: "left", whiteSpace: "nowrap",
};
const emptyCell: CSSProperties = {
  textAlign: "center", padding: "40px 0", color: "#66728a", fontSize: 13,
};
const toggleBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  background: "none", border: "none", cursor: "pointer", padding: "0 0 6px 0",
};
