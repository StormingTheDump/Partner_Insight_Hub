import { Tag } from 'antd';

interface PlaceholderProps {
  icon: string;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
  tags?: string[];
}

function PlaceholderPage({ icon, title, iconBg, iconColor, tags = [] }: PlaceholderProps) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={{ ...styles.iconTile, background: iconBg, color: iconColor }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
        </div>
        <h2 style={styles.title}>{title}</h2>
        <div style={styles.tagRow}>
          <Tag color="processing" style={{ borderRadius: 6 }}>开发中</Tag>
          <Tag color="blue" style={{ borderRadius: 6 }}>M1 阶段</Tag>
          {tags.map(t => <Tag key={t} color="default" style={{ borderRadius: 6 }}>{t}</Tag>)}
        </div>
      </div>
    </div>
  );
}

export function MatchingPage() {
  return (
    <PlaceholderPage
      icon="⇌"
      title="渠道匹配关系管理"
      description="上传宝米酒店匹配关系文件，查看历史匹配记录，展示匹配覆盖率与 OSS 数据对比。"
      iconBg="#FCF4DA"
      iconColor="#F59E0B"
    />
  );
}

export function ContactPage() {
  return (
    <PlaceholderPage
      icon="📞"
      title="联系方式"
      description="展示专属客户经理、BD 经理、CS、财务联系人信息，以及 7×24 小时客服电话与邮箱。"
      iconBg="#FDE3E3"
      iconColor="#EF4444"
    />
  );
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
    background: '#fff',
    borderRadius: 12,
    border: '1px solid var(--line)',
    boxShadow: '0 2px 12px rgba(0,9,71,0.06)',
    maxWidth: 480,
    width: '100%',
  },
  iconTile: {
    width: 72,
    height: 72,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  title: {
    margin: '0 0 12px',
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text)',
  },
  tagRow: {
    marginTop: 24,
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
};
