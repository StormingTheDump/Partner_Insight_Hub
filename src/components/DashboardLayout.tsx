import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Tag } from 'antd';
import {
  LineChartOutlined,
  SearchOutlined,
  SwapOutlined,
  WalletOutlined,
  PhoneOutlined,
  RobotOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import type { User } from '../data/users';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/dashboard/metrics',  icon: <LineChartOutlined />, label: '指标界面' },
  { key: '/dashboard/orders',   icon: <SearchOutlined />,    label: '订单搜索下载' },
  { key: '/dashboard/matching', icon: <SwapOutlined />,      label: '渠道匹配关系管理' },
  { key: '/dashboard/finance',  icon: <WalletOutlined />,    label: '财务信息' },
  { key: '/dashboard/contact',  icon: <PhoneOutlined />,     label: '联系方式' },
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={styles.sider}
      >
        <div style={styles.brand}>
          <div style={styles.brandIcon}>D</div>
          {!collapsed && <span style={styles.brandText}>Partner Insight Hub</span>}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ background: 'transparent', border: 'none', marginTop: 8 }}
          items={NAV_ITEMS.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate(item.key),
          }))}
        />
      </Sider>

      <Layout>
        <Header style={styles.header}>
          <div style={styles.headerLeft}>
            <span
              style={styles.collapseBtn}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Text style={styles.channelName}>{user.channelName}</Text>
          </div>

          <div style={styles.headerRight}>
            <Tag color="green" style={{ marginRight: 12 }}>已连接</Tag>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={styles.avatarRow}>
                <Avatar icon={<UserOutlined />} style={{ background: '#1a73e8' }} />
                {!collapsed && (
                  <span style={styles.userName}>{user.contactName}</span>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={styles.content}>
          <Outlet />
        </Content>
      </Layout>

      {/* AI 助手悬浮按钮 */}
      <div style={styles.aiBtn} title="AI 智能助手（API 文档问答）">
        <RobotOutlined style={{ fontSize: 22, color: '#fff' }} />
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sider: {
    background: 'linear-gradient(180deg, #0f1b35 0%, #1a2d52 100%)',
    boxShadow: '2px 0 12px rgba(0,0,0,0.2)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 16px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  brandIcon: {
    width: 32,
    height: 32,
    background: 'linear-gradient(135deg, #1a73e8, #4fa3f7)',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandText: {
    color: '#fff',
    fontWeight: 600,
    fontSize: 13,
    lineHeight: '1.3',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  header: {
    background: '#fff',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    height: 60,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  headerRight: { display: 'flex', alignItems: 'center' },
  collapseBtn: {
    fontSize: 18,
    cursor: 'pointer',
    color: '#555',
    padding: 4,
    borderRadius: 4,
    transition: 'color 0.2s',
  },
  channelName: { fontSize: 15, fontWeight: 600, color: '#222' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  userName: { fontSize: 14, color: '#333' },
  content: {
    margin: 24,
    minHeight: 'calc(100vh - 108px)',
  },
  aiBtn: {
    position: 'fixed',
    bottom: 32,
    right: 32,
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a73e8, #0f5bbf)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(26,115,232,0.45)',
    zIndex: 999,
    transition: 'transform 0.2s',
  },
};
