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
          <button type="button" onClick={downloadCsv} style={exportBtn}>
            <Download size={14} /> 导出 CSV
          </button>
        }
      />

      {/* Stats row */}
      <div style={statsRow}>
        {[
          { label: "全部酒店", value: total,   color: "#000947", bg: "#eef1ff" },
          { label: "三星热销", value: cnt3,    color: "#dc2626", bg: "#fef2f2" },
          { label: "二星热销", value: cnt2,    color: "#d97706", bg: "#fffbeb" },
          { label: "一星热销", value: cnt1,    color: "#6b7280", bg: "#f4f4f5" },
        ].map(s => (
          <div key={s.label} style={{ ...statCard, background: s.bg }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={filterBar}>
        <select value={country} onChange={e => setCountry(e.target.value)} style={sel}>
          <option value="">全部国家</option>
          {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={city} onChange={e => setCity(e.target.value)} style={sel}>
          <option value="">全部城市</option>
          {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={hotLevel} onChange={e => setHotLevel(e.target.value)} style={sel}>
          <option value="">全部热销等级</option>
          <option value="3">★★★ 三星热销</option>
          <option value="2">★★ 二星热销</option>
          <option value="1">★ 一星热销</option>
        </select>
        <select value={starRating} onChange={e => setStarRating(e.target.value)} style={sel}>
          <option value="">全部星级</option>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} 星</option>)}
        </select>
        <button type="button" onClick={handleFilter} style={searchBtn}>
          <Search size={13} /> 搜索
        </button>
        {(country || city || hotLevel || starRating) && (
          <button type="button" onClick={handleReset} style={resetBtn}>
            <X size={13} /> 重置
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          共 <strong>{filtered.length}</strong> 条
        </span>
      </div>

      {/* Table */}
      <div style={tableWrap}>
        <table style={table}>
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
            ) : pageRows.map((h, i) => {
              const hm = HOT_META[h.hot_level];
              return (
                <tr key={h.hotel_id} style={{ background: i % 2 === 0 ? "#fff" : "var(--surface-soft)" }}>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#000947" }}>
                    {h.hotel_id}
                  </td>
                  <td style={{ ...td, fontWeight: 600, maxWidth: 220 }}>{h.hotel_name}</td>
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
            disabled={safePage === 1} style={pageBtn}>上一页</button>
          <span style={{ fontSize: 12, color: "var(--muted)", padding: "0 8px" }}>
            第 {safePage} / {totalPages} 页
          </span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages} style={pageBtn}>下一页</button>
        </div>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const statsRow: CSSProperties = { display: "flex", gap: 12, marginBottom: 16 };
const statCard: CSSProperties = {
  flex: 1, borderRadius: 10, padding: "14px 18px",
  border: "1px solid rgba(0,0,0,0.06)",
};
const filterBar: CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
  background: "#fff", border: "1px solid var(--line)", borderRadius: 8,
  padding: "12px 16px", marginBottom: 12,
};
const sel: CSSProperties = {
  height: 34, padding: "0 10px", borderRadius: 6,
  border: "1px solid var(--line)", background: "var(--surface-soft)",
  fontSize: 13, color: "var(--text)", cursor: "pointer", outline: "none",
};
const searchBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  height: 34, padding: "0 14px", borderRadius: 6,
  background: "var(--dida-navy)", color: "#fff", border: "none",
  cursor: "pointer", fontSize: 13, fontWeight: 600,
};
const resetBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  height: 34, padding: "0 12px", borderRadius: 6,
  border: "1px solid var(--line)", background: "var(--surface-soft)",
  cursor: "pointer", fontSize: 13, color: "var(--muted-strong)",
};
const exportBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  height: 34, padding: "0 14px", borderRadius: 6,
  background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
  cursor: "pointer", fontSize: 13, fontWeight: 600,
};
const tableWrap: CSSProperties = {
  background: "#fff", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden",
};
const table: CSSProperties = { width: "100%", borderCollapse: "collapse" };
const th: CSSProperties = {
  padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700,
  color: "var(--muted-strong)", background: "var(--surface-soft)",
  borderBottom: "1px solid var(--line)", whiteSpace: "nowrap",
};
const td: CSSProperties = {
  padding: "9px 14px", fontSize: 13, color: "var(--text)", borderBottom: "1px solid var(--line)",
};
const emptyCell: CSSProperties = { textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 };
const pager: CSSProperties = { display: "flex", alignItems: "center", gap: 4, marginTop: 12 };
const pageBtn: CSSProperties = {
  height: 30, padding: "0 12px", borderRadius: 6,
  border: "1px solid var(--line)", background: "#fff",
  cursor: "pointer", fontSize: 13, color: "var(--text)",
};
