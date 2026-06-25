import { useState } from 'react';
import { Avatar, Dropdown, Badge } from 'antd';
import {
  LineChartOutlined,
  ShoppingOutlined,
  SwapOutlined,
  WalletOutlined,
  PhoneOutlined,
  RobotOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import type { User } from '../data/users';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  pill?: string;
  pillActive?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: '业务指标',
    items: [
      { key: '/dashboard/metrics',  icon: <LineChartOutlined />, label: '指标概览' },
      { key: '/dashboard/orders',   icon: <ShoppingOutlined />,  label: '订单管理' },
      { key: '/dashboard/finance',  icon: <WalletOutlined />,    label: '财务信息' },
    ],
  },
  {
    title: '渠道管理',
    items: [
      { key: '/dashboard/matching', icon: <SwapOutlined />,    label: '渠道匹配关系管理' },
      { key: '/dashboard/contact',  icon: <PhoneOutlined />,   label: '联系方式' },
    ],
  },
  {
    title: '系统监控',
    items: [
      { key: '/dashboard/logs', icon: <FileTextOutlined />, label: '日志查询', pill: '48h' },
    ],
  },
];

interface Props {
  user: User;
  onLogout: () => void;
}

export default function DashboardLayout({ user, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
        onClick: () => {
          localStorage.removeItem('pih_user');
          sessionStorage.removeItem('pih_user');
          onLogout();
          navigate('/login');
        },
      },
    ],
  };

  const sidebarWidth = collapsed ? 64 : 250;

  return (
    <div style={{ ...styles.app, gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` }}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarWidth }}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.brandIcon}>渠</div>
          {!collapsed && (
            <div style={styles.brandText}>
              <span style={styles.brandZh}>渠道管理平台</span>
              <span style={styles.brandEn}>Partner Insight Hub</span>
            </div>
          )}
        </div>

        {/* Account */}
        <div style={styles.account}>
          <Avatar size={22} icon={<UserOutlined />} style={{ background: 'var(--pih-primary)', flexShrink: 0 }} />
          {!collapsed && <span style={styles.accountName}>{user.channelName}</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} style={styles.navSection}>
              {!collapsed && <p style={styles.sectionTitle}>{section.title}</p>}
              {section.items.map((item) => {
                const active = location.pathname === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.key)}
                    style={{
                      ...styles.navItem,
                      ...(active ? styles.navItemActive : {}),
                      justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                  >
                    <span style={{ ...styles.navIcon, ...(active ? styles.navIconActive : {}) }}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span style={styles.navLabel}>{item.label}</span>
                        {item.pill && (
                          <span style={{
                            ...styles.pill,
                            ...(item.pillActive ? styles.pillActive : {}),
                          }}>
                            {item.pill}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse button */}
        <button
          style={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? '展开侧栏' : '收起侧栏'}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <span style={styles.pageTitle}>{user.channelName}</span>
          </div>
          <div style={styles.topbarRight}>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={styles.userChip}>
                <Avatar size={28} icon={<UserOutlined />} style={{ background: 'var(--pih-primary)' }} />
                <span style={styles.userName}>{user.contactName}</span>
              </div>
            </Dropdown>
            <button style={styles.iconBtn} title="通知">
              <Badge count={1} size="small">
                <BellOutlined style={{ fontSize: 16, color: '#64748B' }} />
              </Badge>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={styles.content}>
          <Outlet />
        </div>
      </main>

      {/* AI assistant FAB */}
      <button style={styles.aiBtn} title="AI 智能助手">
        <RobotOutlined style={{ fontSize: 20, color: '#fff' }} />
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'grid',
    fontFamily: '"Poppins", "PingFang SC", "Microsoft YaHei UI", system-ui, sans-serif',
  },

  /* Sidebar */
  sidebar: {
    position: 'sticky',
    top: 0,
    height: '100vh',
    padding: '18px 12px',
    background: '#fff',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    zIndex: 3,
    overflowX: 'hidden',
    transition: 'width 0.2s ease',
  },
  brand: {
    height: 52,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: 'linear-gradient(135deg, var(--pih-primary), var(--chart-primary))',
    color: '#fff',
    fontWeight: 800,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
    overflow: 'hidden',
  },
  brandZh: {
    color: 'var(--text)',
    fontWeight: 800,
    fontSize: 14,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
  },
  brandEn: {
    color: '#64748B',
    fontWeight: 500,
    fontSize: 10,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3,
    letterSpacing: '0.01em',
  },
  account: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid #E5E7EB',
    background: '#F8FAFC',
    padding: '10px 12px',
    borderRadius: 8,
    overflow: 'hidden',
  },
  accountName: {
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  navSection: {
    borderTop: '1px solid #E5E7EB',
    paddingTop: 14,
    marginTop: 0,
  },
  sectionTitle: {
    margin: '0 0 8px 8px',
    color: '#64748B',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  navItem: {
    width: '100%',
    border: 0,
    background: 'transparent',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '9px 10px',
    borderRadius: 7,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  navItemActive: {
    background: 'var(--pih-primary-soft)',
    color: 'var(--pih-primary)',
  },
  navIcon: {
    fontSize: 16,
    color: '#94A3B8',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  navIconActive: {
    color: 'var(--pih-primary)',
  },
  navLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  pill: {
    marginLeft: 'auto',
    borderRadius: 999,
    padding: '2px 7px',
    fontSize: 10,
    fontWeight: 800,
    background: '#E2E8F0',
    color: '#64748B',
    flexShrink: 0,
  },
  pillActive: {
    color: '#fff',
    background: '#10B981',
  },
  collapseBtn: {
    marginTop: 'auto',
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#71809b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 15,
  },

  /* Main */
  main: { minWidth: 0, display: 'flex', flexDirection: 'column' },
  topbar: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    height: 64,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
  },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 10 },
  pageTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 7,
    border: '1px solid #E5E7EB',
    background: '#fff',
  },
  userName: { fontSize: 13, color: 'var(--text)', fontWeight: 600 },
  iconBtn: {
    width: 34,
    height: 34,
    border: '1px solid #E5E7EB',
    borderRadius: 7,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  /* Content */
  content: {
    flex: 1,
    padding: '24px 32px 64px',
    background: '#F8FAFC',
    minHeight: 'calc(100vh - 64px)',
  },

  /* AI FAB */
  aiBtn: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 0,
    background: '#505AAC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(80,90,172,0.22)',
    zIndex: 4,
  },
};
