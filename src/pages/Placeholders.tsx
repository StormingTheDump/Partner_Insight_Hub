import { Card, Typography, Tag } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface PlaceholderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export function PlaceholderPage({ icon, title, description, color }: PlaceholderProps) {
  return (
    <div style={styles.wrapper}>
      <Card style={styles.card} bordered={false}>
        <div style={{ ...styles.iconCircle, background: color }}>{icon}</div>
        <Title level={3} style={{ marginBottom: 8 }}>{title}</Title>
        <Text type="secondary" style={{ fontSize: 15 }}>{description}</Text>
        <div style={styles.tagRow}>
          <Tag color="processing">开发中</Tag>
          <Tag color="blue">M1 阶段</Tag>
        </div>
      </Card>
    </div>
  );
}

export function MetricsPage() {
  return <PlaceholderPage
    icon={<LineChartOutlined style={{ fontSize: 32, color: '#fff' }} />}
    title="指标界面"
    description="展示有价率、准确率、失败率折线图，支持时间范围筛选及配置指标只读展示。"
    color="linear-gradient(135deg, #1a73e8, #4fa3f7)"
  />;
}

export function OrdersPage() {
  return <PlaceholderPage
    icon={<span style={{ fontSize: 32, color: '#fff' }}>🔍</span>}
    title="订单搜索下载"
    description="按订单号、日期维度、订单状态搜索订单，支持验价/下单/取消请求日志导出。"
    color="linear-gradient(135deg, #52c41a, #389e0d)"
  />;
}

export function MatchingPage() {
  return <PlaceholderPage
    icon={<span style={{ fontSize: 32, color: '#fff' }}>⇌</span>}
    title="渠道匹配关系管理"
    description="上传宝米酒店匹配关系文件，查看历史匹配记录，展示匹配覆盖率与 OSS 数据对比。"
    color="linear-gradient(135deg, #fa8c16, #d46b08)"
  />;
}

export function FinancePage() {
  return <PlaceholderPage
    icon={<span style={{ fontSize: 32, color: '#fff' }}>💰</span>}
    title="财务信息"
    description="展示押金、保险、授信额度、剩余额度，以及账期、未结算金额、月度账单下载等财务信息。"
    color="linear-gradient(135deg, #722ed1, #531dab)"
  />;
}

export function ContactPage() {
  return <PlaceholderPage
    icon={<span style={{ fontSize: 32, color: '#fff' }}>📞</span>}
    title="联系方式"
    description="展示专属客户经理、BD 经理、CS、财务联系人信息，以及 7×24 小时客服电话与邮箱。"
    color="linear-gradient(135deg, #eb2f96, #c41d7f)"
  />;
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 160px)',
  },
  card: {
    textAlign: 'center',
    padding: '48px 56px',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    maxWidth: 500,
    width: '100%',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  tagRow: {
    marginTop: 20,
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
};
