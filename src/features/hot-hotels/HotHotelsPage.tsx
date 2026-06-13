import { useState, useMemo } from "react";
import { Download, Search, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { PageProps } from "@/dashboard/routes";
import { PageHeader } from "@/shared/components/PageHeader";
import { HOT_HOTELS } from "@/data/hot-hotels";

const PAGE_SIZE = 10;

const HOT_META: Record<number, { label: string; color: string; bg: string; border: string }> = {
  3: { label: "★★★", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  2: { label: "★★",  color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  1: { label: "★",   color: "#6b7280", bg: "#f4f4f5", border: "#d1d5db" },
};

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "#f59e0b", letterSpacing: 1 }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

// ── derive unique option lists ─────────────────────────────────────────
const ALL_COUNTRIES = Array.from(new Set(HOT_HOTELS.map(h => h.country))).sort();
const ALL_CITIES    = Array.from(new Set(HOT_HOTELS.map(h => h.city))).sort();

// ── Main page ─────────────────────────────────────────────────────────
export function HotHotelsPage(_: PageProps) {
  const [country,   setCountry]   = useState("");
  const [city,      setCity]      = useState("");
  const [hotLevel,  setHotLevel]  = useState("");
  const [starRating, setStarRating] = useState("");
  const [page,      setPage]      = useState(1);

  const filtered = useMemo(() => {
    return HOT_HOTELS.filter(h => {
      if (country   && h.country !== country)                return false;
      if (city      && h.city !== city)                      return false;
      if (hotLevel  && h.hot_level !== Number(hotLevel))     return false;
      if (starRating && h.star_rating !== Number(starRating)) return false;
      return true;
    });
  }, [country, city, hotLevel, starRating]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleReset = () => {
    setCountry(""); setCity(""); setHotLevel(""); setStarRating(""); setPage(1);
  };

  const handleFilter = () => setPage(1);

  const downloadCsv = () => {
    const header = ["酒店ID", "酒店名称", "国家", "城市", "地址", "星级", "热销等级"];
    const rows = filtered.map(h => [
      h.hotel_id, `"${h.hotel_name}"`, h.country, h.city,
      `"${h.address}"`, h.star_rating, `${h.hot_level}星`,
    ]);
    const csv = "﻿" + [header, ...rows].map(r => r.join(",")).join("\r\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: "hot_hotels.csv",
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── stats ──────────────────────────────────────────────────────────
  const total  = HOT_HOTELS.length;
  const cnt3   = HOT_HOTELS.filter(h => h.hot_level === 3).length;
  const cnt2   = HOT_HOTELS.filter(h => h.hot_level === 2).length;
  const cnt1   = HOT_HOTELS.filter(h => h.hot_level === 1).length;

  return (
    <>
      <PageHeader
        title="Dida 热销酒店推荐"
        description="综合 Dida 大盘产量与客户历史购买数据，优先展示高热度酒店"
        actions={
          <button type="button" onClick={downloadCsv} className="button">
            <Download size={14} /> 导出 CSV
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid four-col">
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>全部酒店</p>
          <div className="metric-value">{total}</div>
        </div>
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>三星热销</p>
          <div className="metric-value">{cnt3}</div>
        </div>
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>二星热销</p>
          <div className="metric-value">{cnt2}</div>
        </div>
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>一星热销</p>
          <div className="metric-value">{cnt1}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row" style={{ marginTop: 16 }}>
        <label className="filter-control">
          <select value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">全部国家</option>
            {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <select value={city} onChange={e => setCity(e.target.value)}>
            <option value="">全部城市</option>
            {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <select value={hotLevel} onChange={e => setHotLevel(e.target.value)}>
            <option value="">全部热销等级</option>
            <option value="3">★★★ 三星热销</option>
            <option value="2">★★ 二星热销</option>
            <option value="1">★ 一星热销</option>
          </select>
        </label>
        <label className="filter-control">
          <select value={starRating} onChange={e => setStarRating(e.target.value)}>
            <option value="">全部星级</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} 星</option>)}
          </select>
        </label>
        <button type="button" onClick={handleFilter} className="button primary">
          <Search size={13} /> 搜索
        </button>
        {(country || city || hotLevel || starRating) && (
          <button type="button" onClick={handleReset} className="button">
            <X size={13} /> 重置
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          共 <strong>{filtered.length}</strong> 条
        </span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {["酒店 ID", "酒店名称", "国家", "城市", "地址", "星级", "热销等级"].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={7} style={emptyCell}>未找到匹配酒店</td></tr>
            ) : pageRows.map((h) => {
              const hm = HOT_META[h.hot_level] ?? HOT_META[1];
              return (
              <tr key={h.hotel_id}>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>
                    {h.hotel_id}
                  </td>
                  <td style={{ ...td, maxWidth: 220 }}>{h.hotel_name}</td>
                  <td style={td}>{h.country}</td>
                  <td style={td}>{h.city}</td>
                  <td style={{ ...td, fontSize: 12, color: "var(--muted)", maxWidth: 200 }}>
                    <span title={h.address} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.address}
                    </span>
                  </td>
                  <td style={td}><Stars n={h.star_rating} /></td>
                  <td style={td}>
                    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                      color: hm.color, background: hm.bg, border: `1px solid ${hm.border}`, letterSpacing: 1 }}>
                      {hm.label}
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
        <div style={pager}>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1} className="button">上一页</button>
          <span style={{ fontSize: 12, color: "var(--muted)", padding: "0 8px" }}>
            第 {safePage} / {totalPages} 页
          </span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages} className="button">下一页</button>
        </div>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const th: CSSProperties = {
  position: "sticky", top: 0, zIndex: 2,
  background: "#f8fafd", color: "#526078",
  fontSize: 12, fontWeight: 800,
  padding: "11px 13px",
  borderBottom: "2px solid var(--line)",
  whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left",
};
const td: CSSProperties = {
  padding: "11px 13px", borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle", textAlign: "left", whiteSpace: "nowrap",
};
const emptyCell: CSSProperties = { textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 };
const pager: CSSProperties = { display: "flex", alignItems: "center", gap: 4, marginTop: 12 };
