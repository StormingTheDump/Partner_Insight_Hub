import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@/styles/layout.css";

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Filter,
  LogOut,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import didaIcon from "@/assets/Icon-DIDA_red.svg";
import didaLogo from "@/assets/logo-DIDA_positive.svg";
import { useAppState, AppStateProvider } from "@/dashboard/app-state";
import { navSections } from "@/dashboard/navigation";
import { routes } from "@/dashboard/routes";
import type { User as AuthUser } from "@/data/users";

const API = "";

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

  const [clientIdOptions, setClientIdOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API}/api/orders`)
      .then((r) => r.json())
      .then(({ data }: { data: Array<{ client_id: string }> }) => {
        const ids = Array.from(new Set(data.map((r) => r.client_id))).sort() as string[];
        setClientIdOptions(ids);
      })
      .catch(() => {});
  }, []);

  const feedChoices = ["全部渠道", ...clientIdOptions];
  const ActivePage = routes[activePage];

  return (
    <div className={`app${collapsed ? " collapsed" : ""}`}>
      <aside className="sidebar" aria-label="渠道管理平台导航">
        {/* Logo */}
        <div className="brand">
          <img src={collapsed ? didaIcon : didaLogo} alt="DIDA" />
        </div>

        {/* Channel account info */}
        <div className="account">
          <img src={didaIcon} alt="" />
          <span title={user.channelName}>{user.channelName}</span>
        </div>

        {/* Nav sections */}
        <nav className="nav">
          {navSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <p className="section-title">{section.title}</p>
              {section.items.map((item) => {
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
          ))}
        </nav>

        {/* Collapse toggle */}
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
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <label className="filter-control">
              <Filter className="icon" />
              <select
                value={selectedFeed}
                onChange={(e) => setSelectedFeed(e.target.value)}
                aria-label="渠道筛选"
              >
                {feedChoices.map((feed) => (
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
            <button type="button" className="icon-button" aria-label="通知">
              <Bell className="icon" />
              <span className="badge">1</span>
            </button>
            {/* User + logout */}
            <button
              type="button"
              className="filter-control"
              title={`${user.contactName} · 退出登录`}
              style={{ gap: 8, cursor: "pointer" }}
            >
              <User className="icon" />
              <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.contactName}
              </span>
            </button>
            <button
              type="button"
              className="button danger icon-only"
              aria-label="退出登录"
              title="退出登录"
              onClick={() => {
                localStorage.removeItem("pih_user");
                sessionStorage.removeItem("pih_user");
                onLogout();
              }}
            >
              <LogOut className="icon" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <section className="page">
          <ActivePage selectedFeed={selectedFeed} showPreviousPeriod={showPreviousPeriod} />
        </section>
      </main>
    </div>
  );
}

export function AppShell({ user, onLogout }: AppShellInnerProps) {
  return (
    <AppStateProvider>
      <AppShellInner user={user} onLogout={onLogout} />
    </AppStateProvider>
  );
}
