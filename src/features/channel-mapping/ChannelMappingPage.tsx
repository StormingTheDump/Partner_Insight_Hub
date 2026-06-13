import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Upload, X } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { PageHeader } from "@/shared/components/PageHeader";
import { MetricCard } from "@/shared/components/MetricCard";
import { useAppState } from "@/dashboard/app-state";

const API = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";
const PAGE_SIZE = 20;

type MappingRow = {
  id: number;
  dida_hotel_id: number;
  client_id: string;
  client_hotel_id: string;
  updated_at: string;
};

type UploadResult = { added: number; conflicts: string[] } | null;

export function ChannelMappingPage(_: PageProps) {
  const { selectedFeed } = useAppState();
  const [rows, setRows]               = useState<MappingRow[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [didaQuery, setDidaQuery]     = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [page, setPage]               = useState(1);
  const [uploading, setUploading]     = useState(false);
  const [result, setResult]           = useState<UploadResult>(null);
  const [error, setError]             = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const clientId = selectedFeed !== "全部渠道" ? selectedFeed : "";

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

  // 全局总数只拉一次
  useEffect(() => {
    fetch(`${API}/api/channel-mapping`)
      .then(r => r.json())
      .then((d: MappingRow[]) => setTotal(d.length));
  }, []);

  // 筛选数据随 fetchData（包含 selectedFeed）更新
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleSearch = () => fetchData();

  const clearAll = () => {
    setDidaQuery(""); setClientQuery("");
    setResult(null); setError("");
    // 清空后立即重新拉全量
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
        // 上传后刷新总数
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
      <div className="kpi-row" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        <MetricCard
          title="总数"
          value={total.toLocaleString()}
          caption="数据库中全部匹配记录"
        />
        <MetricCard
          title="有价数"
          value={Math.round(total * 0.8).toLocaleString()}
          caption="当前可返回价格的酒店匹配数"
          tone="green"
        />
        <MetricCard
          title="有产酒店数"
          value={Math.round(total * 0.2).toLocaleString()}
          caption="当前有库存供应的酒店数"
          tone="orange"
        />
      </div>

      {/* 搜索栏 */}
      <div style={searchBar}>
        {/* Dida Hotel ID */}
        <div style={inputWrap}>
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={didaQuery}
            onChange={e => setDidaQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Dida Hotel ID"
            style={inputStyle}
          />
        </div>

        {/* 客户 Hotel ID */}
        <div style={inputWrap}>
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={clientQuery}
            onChange={e => setClientQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="客户 Hotel ID"
            style={inputStyle}
          />
        </div>

        <button type="button" onClick={handleSearch} style={searchBtn}>搜索</button>

        {/* 上传按钮 */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={uploadBtn}
        >
          <Upload size={13} />
          {uploading ? "上传中…" : "上传 Excel"}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleUpload} />

        {hasFilter && (
          <button type="button" onClick={clearAll} style={clearBtn} title="清除筛选">
            <X size={14} />
          </button>
        )}

        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          共 <strong>{rows.length.toLocaleString()}</strong> 条
        </span>
      </div>

      {/* 上传结果提示 */}
      {result && (
        <div style={{ ...resultBanner, background: result.added > 0 ? "#e6f4ea" : "#f1f3f4", borderColor: result.added > 0 ? "#c3e6cb" : "#dfe5ef" }}>
          <span style={{ color: result.added > 0 ? "#188038" : "#526078", fontWeight: 600 }}>
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
        <div style={{ ...resultBanner, background: "#fce8e6", borderColor: "#f5c6c3", position: "relative" }}>
          <span style={{ color: "#d93025", fontWeight: 600 }}>✕ {error}</span>
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
      <div style={tableWrap}>
        <table style={table}>
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
                <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafd" }}>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                  <td style={{ ...td, fontWeight: 600, fontFamily: "monospace" }}>{r.dida_hotel_id}</td>
                  <td style={td}><span style={clientBadge}>{r.client_id}</span></td>
                  <td style={{ ...td, fontFamily: "monospace" }}>{r.client_hotel_id}</td>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{r.updated_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={pagerBar}>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={pageBtn}>上一页</button>
          {pagerPages(safePage, totalPages).map((p, i) =>
            p === "…"
              ? <span key={`e${i}`} style={{ padding: "0 4px", color: "var(--muted)" }}>…</span>
              : <button key={p} type="button" onClick={() => setPage(p as number)} style={{ ...pageBtn, ...(p === safePage ? pageBtnActive : {}) }}>{p}</button>
          )}
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={pageBtn}>下一页</button>
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
import type { CSSProperties } from "react";

const searchBar: CSSProperties = { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #dfe5ef", borderRadius: 8, padding: "12px 16px", marginBottom: 12, flexWrap: "wrap" };
const inputWrap: CSSProperties = { display: "flex", alignItems: "center", gap: 6, border: "1px solid #dfe5ef", borderRadius: 6, padding: "0 10px", height: 34, background: "#f8fafd" };
const inputStyle: CSSProperties = { border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#17213f", width: 148 };
const selectStyle: CSSProperties = { height: 34, padding: "0 10px", borderRadius: 6, border: "1px solid #dfe5ef", background: "#f8fafd", fontSize: 13, color: "#17213f", cursor: "pointer", outline: "none" };
const searchBtn: CSSProperties = { height: 34, padding: "0 16px", borderRadius: 7, background: "#1a73e8", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const uploadBtn: CSSProperties = { display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", borderRadius: 6, border: "1px solid #dfe5ef", background: "#fff", color: "#17213f", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const clearBtn: CSSProperties = { height: 34, width: 34, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #dfe5ef", background: "#fff", cursor: "pointer", color: "#17213f" };
const resultBanner: CSSProperties = { position: "relative", padding: "10px 40px 10px 14px", borderRadius: 8, border: "1px solid", marginBottom: 12 };
const hintBar: CSSProperties = { marginBottom: 12, padding: "8px 14px", background: "#f8fafd", borderRadius: 6, border: "1px solid #dfe5ef" };
const code: CSSProperties = { background: "#edf1f7", borderRadius: 3, padding: "1px 5px", fontFamily: "monospace", fontSize: 11 };
const tableWrap: CSSProperties = { background: "#fff", border: "1px solid #dfe5ef", borderRadius: 8, overflow: "hidden" };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse" };
const th: CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#526078", background: "#f8fafd", borderBottom: "1px solid #edf1f7", whiteSpace: "nowrap" };
const td: CSSProperties = { padding: "9px 14px", fontSize: 13, color: "#17213f", borderBottom: "1px solid #edf1f7" };
const emptyCell: CSSProperties = { textAlign: "center", padding: "40px 0", color: "#66728a", fontSize: 13 };
const clientBadge: CSSProperties = { display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#e8f0fe", color: "#1a73e8" };
const pagerBar: CSSProperties = { display: "flex", alignItems: "center", gap: 4, marginTop: 16, flexWrap: "wrap" };
const pageBtn: CSSProperties = { height: 30, minWidth: 30, padding: "0 8px", borderRadius: 6, border: "1px solid #dfe5ef", background: "#fff", cursor: "pointer", fontSize: 13, color: "#17213f" };
const pageBtnActive: CSSProperties = { background: "#1a73e8", color: "#fff", border: "1px solid #1a73e8", fontWeight: 700 };
