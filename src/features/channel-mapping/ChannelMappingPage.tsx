import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Upload, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { PageProps } from "@/dashboard/routes";
import { PageHeader } from "@/shared/components/PageHeader";

const API = import.meta.env.VITE_API_BASE ?? "";
const PAGE_SIZE = 20;
const CLIENT_IDS = ["Agoda", "AgodaUK", "AgodaEBK", "Lvzan", "Barli2b", "DidaOpaq"];

type MappingRow = {
  id: number;
  dida_hotel_id: number;
  client_id: string;
  client_hotel_id: string;
  updated_at: string;
};

type UploadResult = { added: number; conflicts: string[] } | null;

export function ChannelMappingPage(_: PageProps) {
  const [rows, setRows]               = useState<MappingRow[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [didaQuery, setDidaQuery]     = useState("");
  const [clientId, setClientId]       = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [page, setPage]               = useState(1);
  const [uploading, setUploading]     = useState(false);
  const [result, setResult]           = useState<UploadResult>(null);
  const [error, setError]             = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (didaQuery.trim())  params.set("dida_hotel_id",   didaQuery.trim());
    if (clientId)          params.set("client_id",       clientId);
    if (clientQuery.trim())params.set("client_hotel_id", clientQuery.trim());
    const res = await fetch(`${API}/api/channel-mapping?${params}`);
    const data = await res.json();
    setRows(data);
    setPage(1);
    setLoading(false);
  }, [didaQuery, clientId, clientQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    fetch(`${API}/api/channel-mapping`)
      .then(r => r.json())
      .then((d: MappingRow[]) => setTotal(d.length));
  }, []);

  const handleSearch = () => fetchData();

  const clearAll = () => {
    setDidaQuery(""); setClientId(""); setClientQuery("");
    setResult(null); setError("");
    setLoading(true);
    fetch(`${API}/api/channel-mapping`)
      .then(r => r.json())
      .then(d => { setRows(d); setPage(1); setLoading(false); });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true); setResult(null); setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/api/channel-mapping/upload`, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail ?? "上传失败");
      } else {
        const data: UploadResult = await res.json();
        setResult(data);
        fetchData();
        fetch(`${API}/api/channel-mapping`).then(r => r.json()).then((d: MappingRow[]) => setTotal(d.length));
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilter  = didaQuery || clientId || clientQuery;

  return (
    <>
      <PageHeader
        title="渠道匹配"
        description="查看 Dida 酒店 ID 与渠道客户酒店 ID 的匹配关系，支持上传 Excel 批量新增。"
      />

      {/* 指标卡片 */}
      <div className="grid three-col">
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>总数</p>
          <div className="metric-value">{total.toLocaleString()}</div>
        </div>
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>有价数</p>
          <div className="metric-value">{Math.round(total * 0.8).toLocaleString()}</div>
        </div>
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>有产酒店数</p>
          <div className="metric-value">{Math.round(total * 0.2).toLocaleString()}</div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="filter-row">
        <label className="filter-control">
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={didaQuery}
            onChange={e => setDidaQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Dida Hotel ID"
          />
        </label>

        <label className="filter-control">
          <select value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">全部客户 ID</option>
            {CLIENT_IDS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="filter-control">
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={clientQuery}
            onChange={e => setClientQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="客户 Hotel ID"
          />
        </label>

        <button type="button" onClick={handleSearch} className="button primary">搜索</button>

        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="button">
          <Upload size={13} />
          {uploading ? "上传中…" : "上传 Excel"}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleUpload} />

        {hasFilter && (
          <button type="button" onClick={clearAll} className="button icon-only" title="清除筛选">
            <X size={14} />
          </button>
        )}

        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          共 <strong>{rows.length.toLocaleString()}</strong> 条
        </span>
      </div>

      {/* 上传结果提示 */}
      {result && (
        <div style={{ ...resultBanner, background: result.added > 0 ? "#e6f4ea" : "#f1f3f4", borderColor: result.added > 0 ? "#c3e6cb" : "var(--line)" }}>
          <span style={{ color: result.added > 0 ? "var(--google-green)" : "var(--muted-strong)", fontWeight: 600 }}>
            ✓ 已新增 {result.added} 条匹配关系，数据库已更新
          </span>
          {result.conflicts.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#935100" }}>
              {result.conflicts.slice(0, 5).map((c, i) => <div key={i}>⚠ {c}</div>)}
              {result.conflicts.length > 5 && <div>…及其他 {result.conflicts.length - 5} 条冲突</div>}
            </div>
          )}
          <button type="button" onClick={() => setResult(null)} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={14} /></button>
        </div>
      )}
      {error && (
        <div style={{ ...resultBanner, background: "#fce8e6", borderColor: "#f5c6c3" }}>
          <span style={{ color: "var(--google-red)", fontWeight: 600 }}>✕ {error}</span>
          <button type="button" onClick={() => setError("")} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={14} /></button>
        </div>
      )}

      {/* 格式说明 */}
      <div style={hintBar}>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>
          📎 上传格式：Excel 文件，列顺序为&nbsp;
          <code style={code}>DidaHotelID</code>&nbsp;/&nbsp;
          <code style={code}>客户ID</code>&nbsp;/&nbsp;
          <code style={code}>客户HotelID</code>，第一行为表头，跳过。
          重复记录自动跳过，非一一对应关系报错。
        </span>
      </div>

      {/* 表格 */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ ...th, width: 56 }}>#</th>
              <th style={th}>Dida Hotel ID</th>
              <th style={th}>客户 ID</th>
              <th style={th}>客户 Hotel ID</th>
              <th style={{ ...th, width: 180 }}>更新时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={emptyCell}>加载中…</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={5} style={emptyCell}>未找到匹配记录</td></tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{r.dida_hotel_id}</td>
                  <td style={td}><span className="status info">{r.client_id}</span></td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{r.client_hotel_id}</td>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{r.updated_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 16, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="button">上一页</button>
          {pagerPages(safePage, totalPages).map((p, i) =>
            p === "…"
              ? <span key={`e${i}`} style={{ padding: "0 4px", color: "var(--muted)" }}>…</span>
              : <button key={p} type="button" onClick={() => setPage(p as number)} className={`button${p === safePage ? " primary" : ""}`}>{p}</button>
          )}
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="button">下一页</button>
          <span style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)" }}>第 {safePage} / {totalPages} 页</span>
        </div>
      )}
    </>
  );
}

function pagerPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

// ── styles ───────────────────────────────────────────────────────
import type { } from "react";

const resultBanner: CSSProperties = { position: "relative", padding: "10px 40px 10px 14px", borderRadius: 8, border: "1px solid", marginBottom: 12 };
const hintBar: CSSProperties = { marginBottom: 12, padding: "8px 14px", background: "#f8fafd", borderRadius: 6, border: "1px solid var(--line)" };
const code: CSSProperties = { background: "#edf1f7", borderRadius: 3, padding: "1px 5px", fontFamily: "var(--font-mono)", fontSize: 11 };
const th: CSSProperties = { position: "sticky", top: 0, zIndex: 2, background: "#f8fafd", color: "#526078", fontSize: 12, fontWeight: 800, padding: "11px 13px", borderBottom: "2px solid var(--line)", whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left" };
const td: CSSProperties = { padding: "11px 13px", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", textAlign: "left", whiteSpace: "nowrap" };
const emptyCell: CSSProperties = { textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 };
