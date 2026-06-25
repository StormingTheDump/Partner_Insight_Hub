import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowRight, BarChart2, Info, Shield, Zap } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { PageHeader } from "@/shared/components/PageHeader";
import { useAppState } from "@/dashboard/app-state";
import "./MarketplaceConfigurationPage.css";

const API = import.meta.env.VITE_API_BASE ?? "";

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
  const [configs, setConfigs] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const clientId = selectedFeed !== "全部渠道" ? selectedFeed : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientId) params.set("client_id", clientId);
      const response = await fetch(`${API}/api/channel-config?${params}`);
      const data = response.ok ? await response.json() : [];
      setConfigs(Array.isArray(data) ? data : []);
    } catch {
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return (
    <div className="channel-config-page">
      <PageHeader
        title="渠道配置"
        description="查看 Dida 为各渠道账号配置的系统参数，包括访问控制、ARI 策略及技术限速。"
        actions={<span className="channel-config-count">共 {configs.length} 个渠道账号</span>}
      />

      <div className="channel-config-notice" role="note">
        <Info className="icon" />
        <span>
          以上配置均由 Dida 技术团队统一管理。如对任何配置参数有疑问或需要调整，请参阅{" "}
          <button type="button" className="channel-config-link" onClick={() => setActivePage("contact")}>
            联系方式 <ArrowRight className="icon" />
          </button>{" "}
          联系您的专属 Dida 负责人。
        </span>
      </div>

      {loading ? (
        <div className="channel-config-state">加载中…</div>
      ) : configs.length === 0 ? (
        <div className="channel-config-state">未找到配置信息</div>
      ) : (
        <div className="channel-config-list">
          {configs.map((cfg) => (
            <ConfigCard cfg={cfg} key={cfg.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReadOnlySwitch({ value }: { value: number }) {
  const enabled = Boolean(value);

  return (
    <button
      aria-label={`${enabled ? "是" : "否"}，只读不可修改`}
      className={`channel-config-readonly-switch${enabled ? " is-on" : ""}`}
      disabled
      title="只读不可修改"
      type="button"
    >
      <span aria-hidden="true" className="channel-config-switch-track">
        <span className="channel-config-switch-thumb" />
      </span>
    </button>
  );
}

function CurrencyTags({ value }: { value: string }) {
  const currencies = value.split("|").filter(Boolean);

  return (
    <span className="channel-config-token-list">
      {currencies.map((currency) => (
        <span className="channel-config-token" key={currency}>
          {currency}
        </span>
      ))}
    </span>
  );
}

function IpList({ value }: { value: string }) {
  const ips = value.split("|").filter(Boolean);
  if (ips.length === 0) {
    return <span className="channel-config-muted">未配置</span>;
  }

  return (
    <span className="channel-config-token-list">
      {ips.map((ip) => (
        <code className="channel-config-token channel-config-token-code" key={ip}>
          {ip}
        </code>
      ))}
    </span>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="channel-config-row">
      <span>{label}</span>
      {children}
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h3>
      {icon}
      {title}
    </h3>
  );
}

function Num({ val, unit }: { val: number; unit?: string }) {
  return (
    <span className="channel-config-value">
      {val}
      {unit ? <small>{unit}</small> : null}
    </span>
  );
}

function dateOnly(value: string) {
  return value?.split(" ")[0] || "—";
}

function ConfigCard({ cfg }: { cfg: ChannelConfig }) {
  const updatedAt = dateOnly(cfg.updated_at);

  return (
    <article className="channel-config-card">
      <header className="channel-config-card-header">
        <div className="channel-config-identity">
          <h2>{cfg.client_id}</h2>
        </div>

        <div className="channel-config-summary" aria-label={`${cfg.client_id} 配置摘要`}>
          <span className="channel-config-summary-item">
            <span>QPS 查价</span>
            <strong>{cfg.qps}/s</strong>
          </span>
          <span className="channel-config-summary-item">
            <span>PPS 酒店</span>
            <strong>{cfg.pps}/s</strong>
          </span>
          <span className="channel-config-summary-item">
            <span>最大酒店 / 请求</span>
            <strong>{cfg.max_hotels_per_request}</strong>
          </span>
          <span className="channel-config-summary-item">
            <span>最后更新</span>
            <strong>{updatedAt}</strong>
          </span>
        </div>
      </header>

      <div className="channel-config-grid">
        <section className="channel-config-section">
          <SectionHeading icon={<Shield className="icon" />} title="基础信息" />
          <Row label="IP 过滤">
            <ReadOnlySwitch value={cfg.ip_filter_enable} />
          </Row>
          <Row label="IP 白名单">
            <IpList value={cfg.ip_filter} />
          </Row>
        </section>

        <section className="channel-config-section">
          <SectionHeading icon={<BarChart2 className="icon" />} title="ARI 配置" />
          <Row label="允许币种">
            <CurrencyTags value={cfg.allowed_currencies} />
          </Row>
          <Row label="忽略中文报价">
            <ReadOnlySwitch value={cfg.ignore_cn_price} />
          </Row>
          <Row label="最大房间数">
            <Num val={cfg.max_rooms} unit="间" />
          </Row>
        </section>

        <section className="channel-config-section">
          <SectionHeading icon={<Zap className="icon" />} title="技术配置" />
          <Row label="查价超时">
            <Num val={cfg.search_timeout} unit="秒" />
          </Row>
          <Row label="验价超时">
            <Num val={cfg.verify_timeout} unit="秒" />
          </Row>
          <Row label="下单超时">
            <Num val={cfg.book_timeout} unit="秒" />
          </Row>
          <Row label="返回 AuditData">
            <ReadOnlySwitch value={cfg.return_audit_data} />
          </Row>
        </section>
      </div>
    </article>
  );
}
