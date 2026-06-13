import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Upload, X, Globe, Flame } from "lucide-react";
import type { CSSProperties } from "react";
import type { PageProps } from "@/dashboard/routes";
import { PageHeader } from "@/shared/components/PageHeader";
import { useAppState } from "@/dashboard/app-state";

const API = import.meta.env.VITE_API_BASE ?? "";
const PAGE_SIZE = 20;
const COUNTRIES = ["中国", "日本", "泰国", "新加坡", "韩国", "马来西亚", "印度尼西亚", "越南", "澳大利亚", "阿联酋"];

type HotSaleRow = {
  id: number;
  channel_id: string;
  hotel_id: string;
  country: string;
  city: string;
  address: string;
  updated_at: string;
};

type Stats = { total: number; matched: number; countries: number };
type UploadResult = { added: number; skipped: number } | null;

export function HotSalesPage(_: PageProps) {
  const { selectedFeed } = useAppState();
  const [rows, setRows]             = useState<HotSaleRow[]>([]);
  const [stats, setStats]           = useState<Stats>({ total: 0, matched: 0, countries: 0 });
  const [loading, setLoading]       = useState(true);
  const [hotelId, setHotelId]       = useState("");
  const [country, setCountry]       = useState("");
  const [city, setCity]             = useState("");
  const [page, setPage]             = useState(1);
  const [uploading, setUploading]   = useState(false);
  const [result, setResult]         = useState<UploadResult>(null);
  const [error, setError]           = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const channelId = selectedFeed !== "全部渠道" ? selectedFeed : "";

  const refreshStats = useCallback(() => {
    fetch(`${API}/api/hot-sales/stats`).then(r => r.json()).then(setStats);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (channelId) p.set("channel_id", channelId);
    if (hotelId.trim()) p.set("hotel_id", hotelId.trim());
    if (country) p.set("country", country);
    if (city.trim()) p.set("city", city.trim());
    const data: HotSaleRow[] = await fetch(`${API}/api/hot-sales?${p}`).then(r => r.json());
    setRows(data);
    setPage(1);
    setLoading(false);
  }, [channelId, hotelId, country, city]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    refreshStats();
  }, [fetchData]);

  const handleSearch = () => fetchData();

  const clearAll = () => {
    setHotelId(""); setCountry(""); setCity("");
    setResult(null); setError("");
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/hot-sales`).then(r => r.json()),
      fetch(`${API}/api/hot-sales/stats`).then(r => r.json()),
    ]).then(([d, s]) => { setRows(d); setStats(s); setPage(1); setLoading(false); });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true); setResult(null); setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/api/hot-sales/upload`, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail ?? "上传失败");
      } else {
        const data: UploadResult = await res.json();
        setResult(data);
        fetchData();
        refreshStats();
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
  const hasFilter  = channelId || hotelId || country || city;

  return (
    <>
      <PageHeader
        title="渠道热销"
        description="管理渠道上传的热销酒店列表，追踪与 Dida 库存的匹配覆盖情况。"
      />

      {/* 指标卡片 */}
      <div className="grid three-col">
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>已上传热销酒店</p>
          <div className="metric-value">{stats.total.toLocaleString()}</div>
        </div>
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>与 Dida 已匹配</p>
          <div className="metric-value">{stats.matched.toLocaleString()}</div>
        </div>
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>覆盖国家 / 地区</p>
          <div className="metric-value">{String(stats.countries)}</div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="filter-row" style={{ marginTop: 16 }}>
        <label className="filter-control">
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input value={hotelId} onChange={e => setHotelId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="酒店 ID" />
        </label>

        <label className="filter-control">
          <select value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">全部国家</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="filter-control">
          <Globe size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input value={city} onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="城市" />
        </label>

        <button type="button" onClick={handleSearch} className="button primary">搜索</button>

        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="button">
          <Upload size={13} />
          {uploading ? "上传中…" : "上传 Excel"}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleUpload} />

        {hasFilter && (
          <button type="button" onClick={clearAll} className="button icon-only" title="清除筛选"><X size={14} /></button>
        )}

        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          共 <strong>{rows.length.toLocaleString()}</strong> 条
        </span>
      </div>

      {/* 上传结果 */}
      {result && (
        <div style={{ ...banner, background: result.added > 0 ? "#e6f4ea" : "#f1f3f4", borderColor: result.added > 0 ? "#c3e6cb" : "var(--line)" }}>
          <span style={{ color: result.added > 0 ? "var(--google-green)" : "var(--muted-strong)", fontWeight: 600 }}>
            ✓ 已新增 {result.added} 条热销记录，数据库已更新
            {result.skipped > 0 && `（跳过 ${result.skipped} 条已存在记录）`}
          </span>
          <button type="button" onClick={() => setResult(null)} style={bannerClose}><X size={14} /></button>
        </div>
      )}
      {error && (
        <div style={{ ...banner, background: "#fce8e6", borderColor: "#f5c6c3" }}>
          <span style={{ color: "var(--google-red)", fontWeight: 600 }}>✕ {error}</span>
          <button type="button" onClick={() => setError("")} style={bannerClose}><X size={14} /></button>
        </div>
      )}

      {/* 格式说明 */}
      <div style={hintBar}>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>
          📎 上传格式：Excel 文件，列顺序&nbsp;
          {["渠道ID", "酒店ID", "酒店国家", "酒店城市", "酒店地址"].map(h => (
            <code key={h} style={codeStyle}>{h}</code>
          ))}
          ，第一行为表头跳过。同一渠道下相同酒店 ID 自动跳过，重复行报错。
        </span>
      </div>

      {/* 表格 */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ ...th, width: 50 }}>#</th>
              <th style={th}>渠道 ID</th>
              <th style={th}>酒店 ID</th>
              <th style={th}>国家 / 地区</th>
              <th style={th}>城市</th>
              <th style={{ ...th, minWidth: 180 }}>酒店地址</th>
              <th style={{ ...th, width: 120 }}>更新时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={emptyCell}>加载中…</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={7} style={emptyCell}>未找到热销记录</td></tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ ...td, color: "var(--muted)", fontSize: 12 }}>{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                  <td style={td}>{r.channel_id}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{r.hotel_id}</td>
                  <td style={td}><span style={countryTag}><Flame size={10} style={{ display: "inline", marginRight: 3 }} />{r.country}</span></td>
                  <td style={td}>{r.city}</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--muted-strong)" }}>{r.address}</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--muted)" }}>{r.updated_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={pagerBar}>
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
const banner: CSSProperties      = { position: "relative", padding: "10px 40px 10px 14px", borderRadius: 8, border: "1px solid", marginBottom: 12 };
const bannerClose: CSSProperties = { position: "absolute", top: 10, right: 12, background: "none", border: "none", cursor: "pointer", color: "var(--muted)" };
const hintBar: CSSProperties     = { marginBottom: 12, padding: "8px 14px", background: "#f8fafd", borderRadius: 6, border: "1px solid var(--line)" };
const codeStyle: CSSProperties   = { background: "#edf1f7", borderRadius: 3, padding: "1px 5px", fontFamily: "var(--font-mono)", fontSize: 11, marginLeft: 3, marginRight: 3 };
const th: CSSProperties          = { position: "sticky", top: 0, zIndex: 2, background: "#f8fafd", color: "#526078", fontSize: 12, fontWeight: 800, padding: "11px 13px", borderBottom: "2px solid var(--line)", whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left" };
const td: CSSProperties          = { padding: "11px 13px", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", textAlign: "left", whiteSpace: "nowrap" };
const emptyCell: CSSProperties   = { textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 };
const countryTag: CSSProperties   = { display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "#fff4db", color: "#b06000" };
const pagerBar: CSSProperties    = { display: "flex", alignItems: "center", gap: 4, marginTop: 16, flexWrap: "wrap" };
