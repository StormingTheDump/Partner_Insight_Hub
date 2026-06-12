
const COLORS = {
  navy: '#000947',
  blue: '#4f5fb8',
  red: '#ea0345',
  green: '#00924c',
  orange: '#f97316',
  muted: '#66728a',
  line: '#dfe5ef',
  lineSoft: '#edf1f7',
  bg: '#f8f9fc',
  surface: '#fff',
};

interface KpiCard {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
  sub?: string;
  iconBg: string;
  iconColor: string;
  icon: string;
}

const KPI_DATA: KpiCard[] = [
  {
    label: '有价率',
    value: '73.2%',
    delta: '+1.5%',
    deltaGood: true,
    sub: '与上月相比',
    iconBg: '#eef5ff',
    iconColor: '#1769ff',
    icon: '📈',
  },
  {
    label: '价格准确率',
    value: '98.1%',
    delta: '-0.3%',
    deltaGood: false,
    sub: '与上月相比',
    iconBg: '#eefaf1',
    iconColor: '#0ca34f',
    icon: '✓',
  },
  {
    label: '验价失败率',
    value: '7.36%',
    delta: '+0.8%',
    deltaGood: false,
    sub: 'Pre-book 请求失败占比',
    iconBg: '#fff0f1',
    iconColor: '#ea0345',
    icon: '⚠',
  },
  {
    label: '今日订单',
    value: '342',
    delta: '+12',
    deltaGood: true,
    sub: '较昨日',
    iconBg: '#fff5e8',
    iconColor: '#f97316',
    icon: '📋',
  },
  {
    label: '本月收入 (TTV)',
    value: '$3,532,888',
    delta: '+1.53%',
    deltaGood: true,
    sub: '与上月相比',
    iconBg: '#f5edff',
    iconColor: '#8b35ff',
    icon: '$',
  },
];

const INSIGHTS = [
  {
    title: '关键洞察',
    body: '2026-05-11 至 2026-06-10 期间，TTV 增长 1.53%，订单数下降 8.23%。平均订单金额从 $305 提升至 $333。',
    tag: '',
  },
  {
    title: '优化高价值渠道',
    body: '重点提升平均订单价值最高渠道的占比，预计可带来 10–15% 的 TTV 增长。',
    tag: 'high',
    tagLabel: '高优',
  },
  {
    title: '提升峰值日订单量',
    body: '分析高 TTV 天的贡献因素，在相似条件下复制成功经验，预计可提升 5–10% 订单量。',
    tag: 'medium',
    tagLabel: '中优',
  },
];

// Simple sparkline points generator (mock)
function sparkPoints(seed: number, w = 180, h = 60) {
  const pts: string[] = [];
  for (let i = 0; i < 14; i++) {
    const x = (i / 13) * w;
    const y = h / 2 + Math.sin(i * 0.9 + seed) * (h * 0.35) + Math.cos(i * 1.5 + seed * 0.7) * (h * 0.15);
    pts.push(`${x.toFixed(1)},${Math.max(2, Math.min(h - 2, y)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export default function MetricsPage() {

  return (
    <div>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.h1}>指标概览</h1>
          <p style={styles.subText}>追踪渠道有价率、订单准确率与收入趋势</p>
        </div>
        <button style={styles.btnOutline}>
          ↓ 导出数据
        </button>
      </div>

      <div style={styles.overviewGrid}>
        {/* Left column */}
        <div style={styles.leftCol}>
          {/* KPI cards */}
          <div style={styles.kpiGrid}>
            {KPI_DATA.map((kpi) => (
              <div key={kpi.label} style={styles.card}>
                <div style={styles.kpiHeader}>
                  <div>
                    <p style={styles.cardLabel}>{kpi.label}</p>
                    <div style={styles.metricValue}>{kpi.value}</div>
                  </div>
                  <div style={{ ...styles.iconTile, background: kpi.iconBg, color: kpi.iconColor }}>
                    <span style={{ fontSize: 20 }}>{kpi.icon}</span>
                  </div>
                </div>
                {kpi.delta && (
                  <p style={{ marginTop: 8 }}>
                    <span style={{ color: kpi.deltaGood ? COLORS.green : COLORS.red, fontSize: 13, fontWeight: 700 }}>
                      {kpi.delta}
                    </span>{' '}
                    <span style={{ color: COLORS.muted, fontSize: 12 }}>{kpi.sub}</span>
                  </p>
                )}
                {/* Sparkline */}
                <svg
                  viewBox="0 0 180 60"
                  preserveAspectRatio="none"
                  style={{ width: '100%', height: 52, marginTop: 12, display: 'block', overflow: 'visible' }}
                >
                  <polyline
                    points={sparkPoints(KPI_DATA.indexOf(kpi) * 2.3)}
                    fill="none"
                    stroke={COLORS.blue}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.7"
                  />
                </svg>
              </div>
            ))}
          </div>

          {/* TTV trend */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <span style={{ color: COLORS.muted }}>$</span>
                <h3 style={styles.h3}>TTV 趋势</h3>
              </div>
              <div style={styles.metricValue}>$3,532,888</div>
            </div>
            <svg
              viewBox="0 0 900 300"
              preserveAspectRatio="none"
              style={{ width: '100%', height: 200, display: 'block', overflow: 'visible', marginTop: 8 }}
            >
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="50" y1={20 + i * 60} x2="880" y2={20 + i * 60}
                  stroke="#e8edf4" strokeDasharray="3 4" />
              ))}
              {/* Axis */}
              <line x1="50" y1="260" x2="880" y2="260" stroke="#8b95a6" />
              {/* Line chart */}
              <polyline
                points={[128,124,104,125,126,91,93,92,127,127,117,122,70,89,86,134,106,162,104,96,127,128,145,165,154,105,87,104,162,145,6]
                  .map((v, i) => {
                    const x = 50 + (i / 30) * 830;
                    const y = 260 - (v / 180) * 240;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  }).join(' ')}
                fill="none"
                stroke={COLORS.blue}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* X-axis labels */}
              {['5月11日', '5月18日', '5月25日', '6月1日', '6月8日', '6月10日'].map((label, i) => (
                <text key={label} x={50 + [0, 7, 14, 21, 27, 30][i] / 30 * 830} y="280"
                  textAnchor="middle" fill="#526078" fontSize="11">{label}</text>
              ))}
            </svg>
            <p style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>所选时间段内的总交易价值（TTV）。</p>
          </div>

          {/* Two small charts */}
          <div style={styles.twoCol}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.h3}>有价率趋势</h3>
                <div style={styles.metricValue}>73.2%</div>
              </div>
              <svg viewBox="0 0 400 140" preserveAspectRatio="none"
                style={{ width: '100%', height: 100, display: 'block', overflow: 'visible', marginTop: 8 }}>
                <line x1="40" y1="120" x2="380" y2="120" stroke="#8b95a6" />
                <polyline
                  points="40,80 80,75 120,90 160,65 200,70 240,60 280,55 320,58 360,52 380,50"
                  fill="none" stroke={COLORS.green} strokeWidth="2.3"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ color: COLORS.muted, fontSize: 12 }}>所选时间段内的有价请求占比。</p>
            </div>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.h3}>验价失败率</h3>
                <div style={styles.metricValue}>7.36%</div>
              </div>
              <svg viewBox="0 0 400 140" preserveAspectRatio="none"
                style={{ width: '100%', height: 100, display: 'block', overflow: 'visible', marginTop: 8 }}>
                <line x1="40" y1="120" x2="380" y2="120" stroke="#8b95a6" />
                <polyline
                  points="40,60 80,65 120,55 160,70 200,75 240,80 280,72 320,65 360,68 380,70"
                  fill="none" stroke={COLORS.red} strokeWidth="2.3"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ color: COLORS.muted, fontSize: 12 }}>验价（Pre-book）请求失败率趋势。</p>
            </div>
          </div>
        </div>

        {/* Right insight rail */}
        <aside style={styles.insightRail}>
          {INSIGHTS.map((ins, idx) => (
            <div key={idx} style={{ ...styles.card, ...styles.purpleCard }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, margin: '0 0 8px', color: COLORS.navy }}>
                🎯 {ins.title}
                {ins.tag === 'high' && (
                  <span style={styles.tagHigh}>{ins.tagLabel}</span>
                )}
                {ins.tag === 'medium' && (
                  <span style={styles.tagMedium}>{ins.tagLabel}</span>
                )}
              </h3>
              <p style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.6 }}>{ins.body}</p>
              {idx > 0 && (
                <p style={{ color: COLORS.green, fontSize: 13, fontWeight: 700, marginTop: 8 }}>
                  {idx === 1 ? '~ 10–15% TTV 增长' : '~ 5–10% 订单提升'}
                </p>
              )}
            </div>
          ))}

          {/* Quick stats */}
          <div style={styles.card}>
            <h3 style={{ ...styles.h3, marginBottom: 16 }}>本季度进度</h3>
            <p style={{ color: COLORS.muted, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
              <span>Q2 2026（70 / 91 天）</span>
              <strong style={{ color: COLORS.navy }}>77%</strong>
            </p>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressBar, width: '77%' }} />
            </div>
            <div style={{ ...styles.card, background: '#f4f6fa', boxShadow: 'none', padding: '12px 16px', marginTop: 12 }}>
              <p style={{ color: COLORS.muted, fontSize: 12 }}>本季度累计 TTV</p>
              <div style={{ ...styles.metricValue, fontSize: 20 }}>$7,883,741</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 26,
  },
  h1: {
    margin: '0 0 6px',
    fontSize: 28,
    fontWeight: 800,
    color: '#000947',
    lineHeight: 1.2,
  },
  h3: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: '#000947',
  },
  subText: { margin: 0, color: '#66728a', fontSize: 14 },
  btnOutline: {
    height: 36,
    borderRadius: 7,
    border: '1px solid #dfe5ef',
    background: '#fff',
    color: '#17213f',
    padding: '0 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 300px',
    gap: 24,
    alignItems: 'start',
  },
  leftCol: { display: 'grid', gap: 16 },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: 16,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  insightRail: {
    position: 'sticky',
    top: 88,
    display: 'grid',
    gap: 14,
    alignSelf: 'start',
  },
  card: {
    background: '#fff',
    border: '1px solid #dfe5ef',
    borderRadius: 8,
    boxShadow: '0 1px 2px rgba(0,9,71,0.06)',
    padding: 20,
    minWidth: 0,
  },
  purpleCard: {
    background: '#fcf8ff',
    borderColor: '#dfc7ff',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    margin: 0,
    color: '#66728a',
    fontSize: 13,
  },
  kpiHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metricValue: {
    marginTop: 4,
    color: '#000',
    fontSize: 22,
    lineHeight: 1.1,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tagHigh: {
    borderRadius: 999,
    padding: '3px 7px',
    fontSize: 10,
    fontWeight: 800,
    color: '#e33838',
    background: '#ffe7e7',
  },
  tagMedium: {
    borderRadius: 999,
    padding: '3px 7px',
    fontSize: 10,
    fontWeight: 800,
    color: '#c66800',
    background: '#fff1d6',
  },
  progressTrack: {
    height: 8,
    background: '#e9edf4',
    borderRadius: 999,
    margin: '10px 0',
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    background: '#4f5fb8',
    borderRadius: 999,
  },
};
