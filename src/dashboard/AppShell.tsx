import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/styles/layout.css";

import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import didaIcon from "@/assets/Icon-DIDA_red.svg";
import didaLogo from "@/assets/logo-DIDA_positive.svg";
import { useAppState, AppStateProvider } from "@/dashboard/app-state";
import { navSections, feedOptions } from "@/dashboard/navigation";
import { routes } from "@/dashboard/routes";
import type { User as AuthUser } from "@/data/users";
import { AccountManagementModal } from "@/features/account-management/AccountManagementModal";

// ─── types ────────────────────────────────────────────────────────────────────

type OverdueBill = {
  bill_no: string;
  client_id: string;
  latest_collection_date: string;
  amount: number;
  status: string;
};

// ─── NotifBell ────────────────────────────────────────────────────────────────

function NotifBell({ onGoFinance }: { onGoFinance: () => void }) {
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState<OverdueBill[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const s = localStorage.getItem("pih_notif_read");
    return s ? new Set(JSON.parse(s) as string[]) : new Set();
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/finance/unsettled-bills?client_id=all")
        .then((r) => r.json())
        .then(({ data }) =>
          setBills((data ?? []).filter((b: OverdueBill) => b.status === "已逾期"))
        )
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = bills.filter((b) => !readIds.has(b.bill_no)).length;

  function toggle() {
    if (!open) {
      const next = new Set([...readIds, ...bills.map((b) => b.bill_no)]);
      setReadIds(next);
      localStorage.setItem("pih_notif_read", JSON.stringify([...next]));
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="icon-button" aria-label="通知" onClick={toggle}>
        <Bell className="icon" />
        {unread > 0 && <span className="badge">{unread}</span>}
      </button>

      {open && (
        <div className="topbar-dropdown" style={{ width: 320 }}>
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--line)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>通知</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{bills.length} 条逾期账单</span>
          </div>

          {bills.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              暂无逾期账单
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {bills.map((b) => (
                <button
                  key={b.bill_no}
                  type="button"
                  onClick={() => { onGoFinance(); setOpen(false); }}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--line-soft)",
                    background: "none", border: "none", cursor: "pointer", display: "block",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted-strong)" }}>
                      {b.bill_no}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444" }}>已逾期</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 12 }}>
                    <span>{b.client_id}</span>
                    <span>回款截止 {b.latest_collection_date}</span>
                    <span style={{ marginLeft: "auto" }}>
                      ${b.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => { onGoFinance(); setOpen(false); }}
              style={{
                width: "100%", fontSize: 12, color: "var(--pih-primary)", fontWeight: 700,
                background: "none", border: "none", cursor: "pointer", textAlign: "center",
              }}
            >
              查看全部账单 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UserMenu ─────────────────────────────────────────────────────────────────

function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [accountMgmt, setAccountMgmt] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleLogout() {
    localStorage.removeItem("pih_user");
    sessionStorage.removeItem("pih_user");
    onLogout();
  }

  return (
    <>
      <div ref={ref} style={{ position: "relative" }}>
        <button
          type="button"
          className="filter-control"
          onClick={() => setOpen((o) => !o)}
          style={{
            gap: 8, cursor: "pointer",
            background: "rgba(80, 90, 172, 0.06)",
            border: "1px solid rgba(80, 90, 172, 0.22)",
            color: "var(--text)",
          }}
        >
          <User className="icon" />
          <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.contactName}
          </span>
        </button>

        {open && (
          <div className="topbar-dropdown">
            <div style={{ padding: "16px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--pih-primary-soft)", color: "var(--pih-primary)",
                  display: "grid", placeItems: "center",
                  fontWeight: 800, fontSize: 16, flexShrink: 0,
                }}>
                  {user.contactName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{user.contactName}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{user.email}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{user.channelName}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: "8px" }}>
              {user.role === "admin" && (
                <button
                  type="button"
                  onClick={() => { setOpen(false); setAccountMgmt(true); }}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 6,
                    border: "none", cursor: "pointer", marginBottom: 4,
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 13, fontWeight: 600,
                    color: "var(--pih-primary)", background: "var(--pih-primary-soft)",
                  }}
                >
                  <Settings style={{ width: 15, height: 15 }} />
                  账号管理
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 6,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, fontWeight: 600,
                  color: "#EF4444", background: "#FDE3E3",
                }}
              >
                <LogOut style={{ width: 15, height: 15 }} />
                退出登录
              </button>
            </div>
          </div>
        )}
      </div>

      <AccountManagementModal
        open={accountMgmt}
        adminUser={user}
        onClose={() => setAccountMgmt(false)}
      />
    </>
  );
}

// ─── AppShellInner ────────────────────────────────────────────────────────────

interface AppShellInnerProps {
  user: AuthUser;
  onLogout: () => void;
}

function AppShellInner({ user, onLogout }: AppShellInnerProps) {
  const {
    activePage,
    setActivePage,
    collapsed,
    setCollapsed,
    selectedFeed,
    setSelectedFeed,
    showPreviousPeriod,
    setShowPreviousPeriod,
    dateRange,
    setDateRange,
  } = useAppState();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["业务指标"]));

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) { next.delete(title); } else { next.add(title); }
      return next;
    });
  };

  const ActivePage = routes[activePage];

  return (
    <div className={`app${collapsed ? " collapsed" : ""}`}>
      <aside className="sidebar" aria-label="渠道管理平台导航">
        <div className="brand">
          <img src={collapsed ? didaIcon : didaLogo} alt="DIDA" />
          {!collapsed && <span className="platform-tag">渠道开放平台</span>}
        </div>

        <nav className="nav">
          {navSections.map((section) => {
            const isOpen = collapsed || expandedSections.has(section.title);
            return (
            <div className="nav-section" key={section.title}>
              <button
                type="button"
                className="section-header"
                onClick={() => toggleSection(section.title)}
              >
                <span className="section-title">{section.title}</span>
                <ChevronDown
                  className={`section-chevron${isOpen ? " open" : ""}`}
                  size={13}
                />
              </button>
              {isOpen && section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    className={`nav-item${activePage === item.id ? " active" : ""}`}
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="icon" />
                    <span className="nav-label">{item.label}</span>
                    {item.badge ? (
                      <span className={`pill${item.badgeTone === "active" ? " active-pill" : ""}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            );
          })}
        </nav>

        <button
          type="button"
          className="button icon-only collapse"
          aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="icon" /> : <ChevronLeft className="icon" />}
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <label className="filter-control">
              <Filter className="icon" />
              <select
                value={selectedFeed}
                onChange={(e) => setSelectedFeed(e.target.value)}
                aria-label="渠道筛选"
              >
                {feedOptions.map((feed) => (
                  <option key={feed} value={feed}>{feed}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="topbar-right">
            <span className="toggle-label">显示上期对比</span>
            <button
              type="button"
              className={`toggle${showPreviousPeriod ? " on" : ""}`}
              aria-pressed={showPreviousPeriod}
              aria-label="切换上期对比"
              onClick={() => setShowPreviousPeriod(!showPreviousPeriod)}
            />
            <DatePicker.RangePicker
              value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
              onChange={(dates) => {
                if (dates?.[0] && dates?.[1]) {
                  setDateRange([dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")]);
                } else {
                  setDateRange(null);
                }
              }}
              allowClear
              placeholder={["开始日期", "结束日期"]}
              style={{ borderRadius: 7, minWidth: 220 }}
            />
            <NotifBell onGoFinance={() => setActivePage("finance")} />
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </header>

        <section className="page">
          <ActivePage selectedFeed={selectedFeed} showPreviousPeriod={showPreviousPeriod} dateRange={dateRange} />
        </section>
      </main>
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

export function AppShell({ user, onLogout }: AppShellInnerProps) {
  return (
    <AppStateProvider>
      <AppShellInner user={user} onLogout={onLogout} />
    </AppStateProvider>
  );
}
