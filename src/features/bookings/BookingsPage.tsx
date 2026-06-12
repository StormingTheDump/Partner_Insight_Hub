import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/dashboard/app-state";
import { Button } from "@/shared/components/Button";
import { PageHeader } from "@/shared/components/PageHeader";
import { useCsvExport } from "@/shared/hooks/useCsvExport";
import type { TableColumn } from "@/shared/types/table";

// ─── types ───────────────────────────────────────────────────────────────────

type OrderRow = {
  client_ref: string;
  dida_ref: string;
  channel_status: string;
  client_id: string;
  dida_hotel_id: string;
  client_hotel_id: string;
  dida_hotel_name: string;
  price: number;
  channel_create_time: string;
  checkin_date: string;
  checkout_date: string;
};

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type LastFilters = {
  feed: string;
  range: [string, string] | null;
  query: string;
};

// ─── column definitions ───────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  Confirmed: "status",
  Canceled: "status warning",
  Failed: "status danger",
};

const columns: (TableColumn<OrderRow> & { px: number; ellipsis?: boolean })[] = [
  { key: "client_ref",          header: "client_ref",          px: 140 },
  { key: "dida_ref",            header: "dida_ref",            px: 110 },
  { key: "channel_status",      header: "channel_status",      px: 130,
    render: (row) => <span className={STATUS_CLASS[row.channel_status] ?? "status neutral"}>{row.channel_status}</span> },
  { key: "client_id",           header: "client_id",           px: 110 },
  { key: "dida_hotel_id",       header: "dida_hotel_id",       px: 130 },
  { key: "client_hotel_id",     header: "client_hotel_id",     px: 140 },
  { key: "dida_hotel_name",     header: "dida_hotel_name",     px: 320, ellipsis: true },
  { key: "price",               header: "price",               px: 110, align: "right" },
  { key: "channel_create_time", header: "channel_create_time", px: 180 },
  { key: "checkin_date",        header: "checkin_date",        px: 130 },
  { key: "checkout_date",       header: "checkout_date",       px: 140 },
];

const TOTAL_MIN_WIDTH = columns.reduce((s, c) => s + c.px, 0); // 1640

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseBatch(input: string): string[] {
  return input.split(/[\n, ]+/).map((s) => s.trim()).filter(Boolean);
}

function pageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  const lo = Math.max(2, current - 1);
  const hi = Math.min(total - 1, current + 1);
  for (let i = lo; i <= hi; i++) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PaginationBar({ meta, onPageChange }: { meta: PaginationMeta; onPageChange: (p: number) => void }) {
  const { page, totalPages, total, pageSize } = meta;
  const pages = pageRange(page, totalPages);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 16, fontSize: 13 }}>
      <span style={{ color: "var(--muted)" }}>
        共 <strong>{total}</strong> 条 · 第 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} 条 · 每页 {pageSize} 条
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          type="button"
          className="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          style={{ minWidth: 68 }}
        >
          上一页
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "var(--muted)" }}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`button${p === page ? " primary" : ""}`}
              onClick={() => onPageChange(p as number)}
              style={{ minWidth: 36, padding: "0 8px" }}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          style={{ minWidth: 68 }}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

// ─── static table cell styles (outside component for stability) ──────────────

const TH_STYLE: React.CSSProperties = {
  position: "sticky",
  top: 0,          // 0 = relative to .table-wrap scroll area (not viewport)
  zIndex: 2,
  background: "#f8fafd",
  color: "#526078",
  fontSize: 12,
  fontWeight: 800,
  padding: "11px 13px",
  borderBottom: "2px solid var(--line)",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  textAlign: "left",
};

const TD_STYLE: React.CSSProperties = {
  padding: "11px 13px",
  borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle",
  textAlign: "left",
  whiteSpace: "nowrap",
};

// ─── main component ───────────────────────────────────────────────────────────

export function BookingsPage() {
  const { selectedFeed, dateRange } = useAppState();

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const [page, setPage] = useState(1);
  const [orderQuery, setOrderQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Track last-fetched filter state to detect changes (for auto page-reset)
  const [lastFilters, setLastFilters] = useState<LastFilters | null>(null);

  // Debounce the textarea input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(orderQuery), 400);
    return () => clearTimeout(t);
  }, [orderQuery]);

  // Derive effective page: reset to 1 when filters change without calling setState in effect
  const filtersChanged =
    lastFilters === null ||
    lastFilters.feed !== selectedFeed ||
    lastFilters.range !== dateRange ||
    lastFilters.query !== debouncedQuery;

  const effectivePage = filtersChanged ? 1 : page;

  // Fetch from backend whenever effective page or filters change
  useEffect(() => {
    const params = new URLSearchParams({ page: String(effectivePage), pageSize: "50" });
    if (selectedFeed !== "全部渠道") params.set("client_id", selectedFeed);
    if (dateRange) { params.set("start_date", dateRange[0]); params.set("end_date", dateRange[1]); }
    const refs = parseBatch(debouncedQuery);
    if (refs.length > 0) params.set("refs", refs.join(","));

    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then(({ data, pagination }: { data: OrderRow[]; pagination: PaginationMeta }) => {
        setRows(data);
        setMeta(pagination);
        setPage(pagination.page);
        setLastFilters({ feed: selectedFeed, range: dateRange, query: debouncedQuery });
        setFirstLoad(false);
      })
      .catch(() => {
        setRows([]);
        setMeta(null);
        setFirstLoad(false);
      });
  }, [effectivePage, selectedFeed, dateRange, debouncedQuery]);

  // CSV export for current page
  const csvColumns = columns.map(({ key, header, align }) => ({ key, header, align }));
  const exportCsv = useCsvExport("dida-bookings.csv", csvColumns as TableColumn<OrderRow>[], rows);

  // Memoized table rows for performance
  const tableRows = useMemo(() =>
    rows.map((row) => (
      <tr key={row.client_ref} style={{ background: undefined }}>
        {columns.map((col) => {
          const isEllipsis = col.ellipsis;
          const rawValue = String((row as Record<string, unknown>)[col.key as string] ?? "");
          const content = col.render ? col.render(row) : rawValue;
          return (
            <td
              key={col.key as string}
              style={{
                ...TD_STYLE,
                textAlign: col.align === "right" ? "right" : "left",
                overflow: isEllipsis ? "hidden" : undefined,
                textOverflow: isEllipsis ? "ellipsis" : undefined,
                maxWidth: isEllipsis ? col.px : undefined,
              }}
              title={isEllipsis ? rawValue : undefined}
            >
              {content}
            </td>
          );
        })}
      </tr>
    )),
    [rows]
  );

  return (
    <>
      <PageHeader
        title="订单管理"
        description="查看您在平台上与 DIDA 的所有订单。"
        actions={
          <Button onClick={exportCsv} disabled={!rows.length}>
            <Download className="icon" /> 导出 CSV
          </Button>
        }
      />

      {/* Order number batch filter */}
      <div className="filter-row" style={{ alignItems: "flex-start" }}>
        <label
          className="filter-control"
          style={{ alignItems: "flex-start", paddingTop: 7, paddingBottom: 7 }}
        >
          <svg
            className="icon"
            style={{ marginTop: 2, flexShrink: 0 }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <textarea
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            placeholder="支持任意订单号检索（逗号、空格或换行分隔批量查询）"
            rows={3}
            style={{
              border: 0,
              outline: 0,
              background: "transparent",
              resize: "vertical",
              minWidth: 340,
              padding: "3px 0",
              fontFamily: "inherit",
              fontSize: "inherit",
              color: "inherit",
              lineHeight: 1.45,
            }}
          />
        </label>
      </div>

      {/* Table */}
      {firstLoad ? (
        <div className="empty-state">加载中…</div>
      ) : (
        <>
          <div className="table-wrap" style={{ maxHeight: "calc(100vh - 360px)", overflowY: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: TOTAL_MIN_WIDTH,
                tableLayout: "fixed",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <colgroup>
                {columns.map((col) => (
                  <col key={col.key as string} style={{ width: col.px }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key as string}
                      style={{
                        ...TH_STYLE,
                        textAlign: col.align === "right" ? "right" : "left",
                      }}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} style={{ ...TD_STYLE, textAlign: "center", color: "var(--muted)" }}>
                      暂无匹配数据
                    </td>
                  </tr>
                ) : (
                  tableRows
                )}
              </tbody>
            </table>
          </div>

          {meta && <PaginationBar meta={meta} onPageChange={setPage} />}
        </>
      )}
    </>
  );
}
