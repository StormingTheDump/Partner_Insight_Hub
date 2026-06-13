import { useState, useMemo } from "react";
import { Download, Search, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { PageProps } from "@/dashboard/routes";
import { PageHeader } from "@/shared/components/PageHeader";
import { DIRECT_HOTELS } from "@/data/direct-hotels";

const PAGE_SIZE = 10;

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "#f59e0b", letterSpacing: 1 }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

function Tag({ active, label, color, bg, border }: {
  active: boolean; label: string; color: string; bg: string; border: string;
}) {
  if (!active) return null;
  return (
    <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      color, background: bg, border: `1px solid ${border}`, marginRight: 4 }}>
      {label}
    </span>
  );
}

const ALL_COUNTRIES = Array.from(new Set(DIRECT_HOTELS.map(h => h.country))).sort();
const ALL_CITIES    = Array.from(new Set(DIRECT_HOTELS.map(h => h.city))).sort();

// ── Main page ─────────────────────────────────────────────────────────
export function DirectHotelsPage(_: PageProps) {
  const [country,     setCountry]     = useState("");
  const [city,        setCity]        = useState("");
  const [filterDirect,    setFilterDirect]    = useState(false);
  const [filterPrebuy,    setFilterPrebuy]    = useState(false);
  const [filterExclusive, setFilterExclusive] = useState(false);
  const [starRating,  setStarRating]  = useState("");
  const [page,        setPage]        = useState(1);

  const filtered = useMemo(() => {
    return DIRECT_HOTELS.filter(h => {
      if (country    && h.country !== country)                 return false;
      if (city       && h.city !== city)                       return false;
      if (starRating && h.star_rating !== Number(starRating))  return false;
      if (filterDirect    && !h.is_direct)    return false;
      if (filterPrebuy    && !h.is_prebuy)    return false;
      if (filterExclusive && !h.is_exclusive) return false;
      return true;
    });
  }, [country, city, starRating, filterDirect, filterPrebuy, filterExclusive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilter = country || city || starRating || filterDirect || filterPrebuy || filterExclusive;

  const handleReset = () => {
    setCountry(""); setCity(""); setStarRating("");
    setFilterDirect(false); setFilterPrebuy(false); setFilterExclusive(false);
    setPage(1);
  };

  const downloadCsv = () => {
    const header = ["酒店ID", "酒店名称", "国家", "城市", "地址", "星级", "直采", "Prebuy", "独家合作"];
    const rows = filtered.map(h => [
      h.hotel_id, `"${h.hotel_name}"`, h.country, h.city,
      `"${h.address}"`, h.star_rating,
      h.is_direct ? "是" : "否",
      h.is_prebuy ? "是" : "否",
      h.is_exclusive ? "是" : "否",
    ]);
    const csv = "﻿" + [header, ...rows].map(r => r.join(",")).join("\r\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: "direct_hotels.csv",
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── stats ──────────────────────────────────────────────────────────
  const total    = DIRECT_HOTELS.length;
  const cntDirect    = DIRECT_HOTELS.filter(h => h.is_direct).length;
  const cntPrebuy    = DIRECT_HOTELS.filter(h => h.is_prebuy).length;
  const cntExclusive = DIRECT_HOTELS.filter(h => h.is_exclusive).length;

  return (
    <>
      <PageHeader
        title="Dida 直采推荐"
        description="直采、Prebuy 及独家合作酒店资源，助力合作伙伴获取竞争优势"
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
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>直采</p>
          <div className="metric-value">{cntDirect}</div>
        </div>
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>Prebuy</p>
          <div className="metric-value">{cntPrebuy}</div>
        </div>
        <div className="card compact">
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>独家合作</p>
          <div className="metric-value">{cntExclusive}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
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
          <select value={starRating} onChange={e => setStarRating(e.target.value)}>
            <option value="">全部星级</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} 星</option>)}
          </select>
        </label>

        {/* Category toggles */}
        <div style={toggleGroup}>
          {([
            { key: "direct",    label: "直采",    state: filterDirect,    set: setFilterDirect    },
            { key: "prebuy",    label: "Prebuy",  state: filterPrebuy,    set: setFilterPrebuy    },
            { key: "exclusive", label: "独家合作", state: filterExclusive, set: setFilterExclusive },
          ] as const).map(({ key, label, state, set }) => (
            <button
              key={key}
              type="button"
              onClick={() => { set(!state); setPage(1); }}
              style={{
                ...togglePill,
                background: state ? "var(--dida-navy)" : "var(--surface-soft)",
                color:      state ? "#fff"    : "var(--muted-strong)",
                border:     state ? "1px solid var(--dida-navy)" : "1px solid var(--line)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setPage(1)} className="button primary">
          <Search size={13} /> 搜索
        </button>
        {hasFilter && (
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
              {["酒店 ID", "酒店名称", "国家", "城市", "地址", "星级", "合作类型"].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={7} style={emptyCell}>未找到匹配酒店</td></tr>
            ) : pageRows.map((h) => (
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
                  <Tag active={h.is_direct}    label="直采"    color="#16a34a" bg="#f0fff4" border="#bbf7d0" />
                  <Tag active={h.is_prebuy}    label="Prebuy"  color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
                  <Tag active={h.is_exclusive} label="独家合作" color="#dc2626" bg="#fef2f2" border="#fecaca" />
                </td>
              </tr>
            ))}
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
const toggleGroup: CSSProperties = { display: "flex", gap: 6 };
const togglePill: CSSProperties = {
  height: 34, padding: "0 12px", borderRadius: 6,
  cursor: "pointer", fontSize: 13, fontWeight: 600,
  transition: "all 0.15s",
};
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
