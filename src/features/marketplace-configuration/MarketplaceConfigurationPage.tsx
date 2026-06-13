import { useCallback, useEffect, useState } from "react";
import { Shield, BarChart2, Zap, Info, ArrowRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { PageProps } from "@/dashboard/routes";
import { PageHeader } from "@/shared/components/PageHeader";
import { useAppState } from "@/dashboard/app-state";

const API = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

type ChannelConfig = {
  id: number;
  client_id: string;
  ip_filter_enable: number;
  ip_filter: string;
  allowed_currencies: string;
  ignore_cn_price: number;
  max_rooms: number;
  qps: number;
  pps: number;
  search_timeout: number;
  verify_timeout: number;
  book_timeout: number;
  max_hotels_per_request: number;
  return_audit_data: number;
  updated_at: string;
};

export function MarketplaceConfigurationPage(_: PageProps) {
  const { setActivePage, selectedFeed } = useAppState();
  const [configs, setConfigs]   = useState<ChannelConfig[]>([]);
  const [loading, setLoading]   = useState(true);

  const clientId = selectedFeed !== "全部渠道" ? selectedFeed : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (clientId) p.set("client_id", clientId);
    const data = await fetch(`${API}/api/channel-config?${p}`).then(r => r.json());
    setConfigs(data);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return (
    <>
      <PageHeader
        title="渠道配置"
        description="查看 Dida 为各渠道账号配置的系统参数，包括访问控制、ARI 策略及技术限速。"
      />

      {/* Notice */}
      <div style={noticeBanner}>
        <Info size={15} style={{ color: "#1a73e8", flexShrink: 0, marginTop: 1 }} />
        <span style={{ color: "#1a73e8", fontSize: 13, lineHeight: 1.5 }}>
          以上配置均由 Dida 技术团队统一管理。如对任何配置参数有疑问或需要调整，请参阅{" "}
          <button type="button" onClick={() => setActivePage("contact")} style={linkBtn}>
            联系方式 <ArrowRight size={11} style={{ verticalAlign: "middle", marginLeft: 1 }} />
          </button>
          {" "}联系您的专属 Dida 负责人。
        </span>
      </div>

      {/* Search */}
      <div style={searchBar}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          共 <strong>{configs.length}</strong> 个渠道账号
        </span>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>加载中…</div>
      ) : configs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>未找到配置信息</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {configs.map(cfg => <ConfigCard key={cfg.id} cfg={cfg} />)}
        </div>
      )}
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function Bool({ value }: { value: number }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: value ? "#e6f4ea" : "#f1f3f4",
      color: value ? "#188038" : "#5f6368",
    }}>
      {value ? "✓ 是" : "✗ 否"}
    </span>
  );
}

const CURRENCY_COLORS = ["#4f5fb8", "#ea0345", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

function CurrencyTags({ value }: { value: string }) {
  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
      {value.split("|").filter(Boolean).map((cur, i) => (
        <span key={cur} style={{
          padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700,
          background: CURRENCY_COLORS[i % CURRENCY_COLORS.length] + "18",
          color: CURRENCY_COLORS[i % CURRENCY_COLORS.length],
        }}>{cur}</span>
      ))}
    </span>
  );
}

function IpList({ value }: { value: string }) {
  const ips = value.split("|").filter(Boolean);
  if (ips.length === 0) return <span style={{ fontSize: 12, color: "var(--muted)" }}>未配置</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
      {ips.map((ip, i) => (
        <code key={i} style={{
          fontSize: 11, fontFamily: "monospace",
          background: "#f1f5f9", padding: "2px 7px", borderRadius: 4, color: "#334155",
        }}>{ip}</code>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: 12, padding: "6px 0", borderBottom: "1px solid #edf1f7",
    }}>
      <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", paddingTop: 2 }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function SecHead({ icon, title, color }: { icon: ReactNode; title: string; color: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      marginBottom: 10, paddingBottom: 8,
      borderBottom: `2px solid ${color}28`,
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 12, color, letterSpacing: 0.4 }}>{title}</span>
    </div>
  );
}

function Num({ val, unit }: { val: number; unit?: string }) {
  return (
    <span style={{ fontWeight: 700, fontSize: 13, color: "#000947" }}>
      {val}
      {unit && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 2 }}>{unit}</span>}
    </span>
  );
}

function ConfigCard({ cfg }: { cfg: ChannelConfig }) {
  return (
    <div style={cardWrap}>
      {/* Header */}
      <div style={cardHead}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>🏪</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: 0.3 }}>
              {cfg.client_id}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
              渠道账号参数配置
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
          <div>最后更新</div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, marginTop: 3 }}>
            {cfg.updated_at.split(" ")[0]}
          </div>
        </div>
      </div>

      {/* Body — 3 sections */}
      <div style={cardBody}>

        {/* 基础信息 */}
        <div style={sec}>
          <SecHead icon={<Shield size={13} />} title="基础信息" color="#4f5fb8" />
          <Row label="IP 过滤"><Bool value={cfg.ip_filter_enable} /></Row>
          <div style={{ paddingTop: 8 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 5 }}>IP 白名单</div>
            <IpList value={cfg.ip_filter} />
          </div>
        </div>

        <div style={vline} />

        {/* ARI 配置 */}
        <div style={sec}>
          <SecHead icon={<BarChart2 size={13} />} title="ARI 配置" color="#604696" />
          <Row label="允许币种"><CurrencyTags value={cfg.allowed_currencies} /></Row>
          <Row label="忽略中文报价"><Bool value={cfg.ignore_cn_price} /></Row>
          <Row label="最大房间数"><Num val={cfg.max_rooms} unit="间" /></Row>
        </div>

        <div style={vline} />

        {/* 技术配置 */}
        <div style={sec}>
          <SecHead icon={<Zap size={13} />} title="技术配置" color="#1a73e8" />
          <Row label="QPS（查价）"><Num val={cfg.qps} unit="/s" /></Row>
          <Row label="PPS（酒店）"><Num val={cfg.pps} unit="/s" /></Row>
          <Row label="查价超时"><Num val={cfg.search_timeout} unit="秒" /></Row>
          <Row label="验价超时"><Num val={cfg.verify_timeout} unit="秒" /></Row>
          <Row label="下单超时"><Num val={cfg.book_timeout} unit="秒" /></Row>
          <Row label="最大酒店 / 请求"><Num val={cfg.max_hotels_per_request} /></Row>
          <Row label="返回 AuditData"><Bool value={cfg.return_audit_data} /></Row>
        </div>

      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

const noticeBanner: CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 10,
  background: "#e8f0fe", border: "1px solid #bfdbfe",
  borderRadius: 8, padding: "11px 16px", marginBottom: 16,
};
const linkBtn: CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: "#1a73e8", fontWeight: 700, fontSize: 13, padding: "0 1px",
  textDecoration: "underline", display: "inline",
};
const searchBar: CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  background: "#fff", border: "1px solid #dfe5ef",
  borderRadius: 8, padding: "12px 16px", marginBottom: 20, flexWrap: "wrap",
};
const selectStyle: CSSProperties = {
  height: 34, padding: "0 10px", borderRadius: 6,
  border: "1px solid #dfe5ef", background: "#f8fafd",
  fontSize: 13, color: "#17213f", cursor: "pointer", outline: "none",
};
const searchBtn: CSSProperties = {
  height: 34, padding: "0 16px", borderRadius: 7,
  background: "#1a73e8", color: "#fff", border: "none",
  cursor: "pointer", fontSize: 13, fontWeight: 600,
};
const clearBtn: CSSProperties = {
  height: 34, padding: "0 14px", borderRadius: 6,
  border: "1px solid #dfe5ef", background: "#fff",
  cursor: "pointer", fontSize: 13, color: "#17213f",
};
const cardWrap: CSSProperties = {
  background: "#fff", border: "1px solid #dfe5ef",
  borderRadius: 8, overflow: "hidden",
  boxShadow: "0 1px 2px rgba(0,9,71,0.06)",
};
const cardHead: CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "16px 22px",
  background: "linear-gradient(135deg, #4f5fb8 0%, #818cf8 100%)",
};
const cardBody: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr auto 1fr",
  padding: "20px 24px",
  gap: 0,
  alignItems: "start",
};
const sec: CSSProperties = { minWidth: 0 };
const vline: CSSProperties = {
  width: 1, background: "#dfe5ef", margin: "0 22px",
};
