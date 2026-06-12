import { useState } from 'react';
import { Select, Input, Button, Table, Tag, Tooltip } from 'antd';
import {
  SearchOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface LogEntry {
  key: string;
  date: string;
  time: string;
  source: string;
  action: string;
  errorType: string;
  supplierMessage: string;
  detail: string;
  errorCount: number;
  leadTime: number;
  hotelId: string;
  rateCode: string;
}

const MOCK_LOGS: LogEntry[] = [
  { key: '1', date: '2026-06-10', time: '11:09:55', source: 'Prebook', action: '验价', errorType: '验价错误', supplierMessage: 'No available room.', detail: 'valuation error from provider', errorCount: 12, leadTime: 10, hotelId: '5362', rateCode: '405-404663' },
  { key: '2', date: '2026-06-10', time: '10:22:41', source: 'Booking', action: '下单', errorType: '下单错误', supplierMessage: 'Rate unavailable.', detail: 'provider timeout', errorCount: 5, leadTime: 4, hotelId: '9201', rateCode: 'RN-2201' },
  { key: '3', date: '2026-06-10', time: '09:45:12', source: 'Prebook', action: '验价', errorType: '超时错误', supplierMessage: 'Request timeout.', detail: 'gateway timeout 30s', errorCount: 28, leadTime: 2, hotelId: '7841', rateCode: 'BB-100012' },
  { key: '4', date: '2026-06-10', time: '08:31:09', source: 'Booking', action: '下单', errorType: '价格变动', supplierMessage: 'Price has changed.', detail: 'price delta > 5%', errorCount: 3, leadTime: 7, hotelId: '3042', rateCode: 'EP-200045' },
  { key: '5', date: '2026-06-09', time: '23:15:33', source: 'Cancel', action: '取消', errorType: '取消错误', supplierMessage: 'Cancellation not allowed.', detail: 'past cancellation deadline', errorCount: 1, leadTime: 0, hotelId: '6701', rateCode: 'NR-550021' },
  { key: '6', date: '2026-06-09', time: '20:48:17', source: 'Prebook', action: '验价', errorType: '验价错误', supplierMessage: 'Hotel closed temporarily.', detail: 'property temporarily closed', errorCount: 7, leadTime: 15, hotelId: '2254', rateCode: '405-882001' },
  { key: '7', date: '2026-06-09', time: '18:22:04', source: 'Booking', action: '下单', errorType: '超时错误', supplierMessage: 'System unavailable.', detail: 'upstream 503', errorCount: 15, leadTime: 3, hotelId: '8830', rateCode: 'RN-9910' },
  { key: '8', date: '2026-06-09', time: '14:10:52', source: 'Prebook', action: '验价', errorType: '验价错误', supplierMessage: 'No available room.', detail: 'sold out at given dates', errorCount: 9, leadTime: 21, hotelId: '4401', rateCode: '405-331107' },
];

const ERROR_TYPE_COLORS: Record<string, string> = {
  '验价错误': 'red',
  '下单错误': 'orange',
  '超时错误': 'volcano',
  '价格变动': 'gold',
  '取消错误': 'purple',
};

export default function LogsPage() {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [filtered, setFiltered] = useState<LogEntry[]>(MOCK_LOGS);

  const handleSearch = () => {
    const result = MOCK_LOGS.filter((row) => {
      const matchAction = actionFilter === 'all' || row.action === actionFilter;
      const matchType = errorTypeFilter === 'all' || row.errorType === errorTypeFilter;
      const matchText = !searchText ||
        row.supplierMessage.toLowerCase().includes(searchText.toLowerCase()) ||
        row.hotelId.includes(searchText) ||
        row.rateCode.toLowerCase().includes(searchText.toLowerCase()) ||
        row.detail.toLowerCase().includes(searchText.toLowerCase());
      return matchAction && matchType && matchText;
    });
    setFiltered(result);
  };

  const totalLoss = filtered.reduce((s, r) => s + r.errorCount * 333, 0);

  const columns: ColumnsType<LogEntry> = [
    {
      title: '时间',
      key: 'time',
      width: 130,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, color: '#061035' }}>{r.date}</div>
          <div style={{ fontSize: 12, color: '#66728a' }}>{r.time}</div>
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 90,
      render: (v) => <span style={{ fontWeight: 600, color: '#000947', fontSize: 13 }}>{v}</span>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 80,
      render: (v) => <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>{v}</Tag>,
    },
    {
      title: '错误类型',
      dataIndex: 'errorType',
      key: 'errorType',
      width: 110,
      render: (v) => (
        <Tag color={ERROR_TYPE_COLORS[v] || 'default'} style={{ borderRadius: 6 }}>{v}</Tag>
      ),
    },
    {
      title: '供应商信息',
      dataIndex: 'supplierMessage',
      key: 'supplierMessage',
      render: (v, r) => (
        <div>
          <div style={{ fontSize: 13, color: '#061035' }}>{v}</div>
          <div style={{ fontSize: 12, color: '#66728a' }}>{r.detail}</div>
        </div>
      ),
    },
    {
      title: '错误数',
      dataIndex: 'errorCount',
      key: 'errorCount',
      width: 80,
      align: 'right',
      render: (v) => <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '提前天数',
      dataIndex: 'leadTime',
      key: 'leadTime',
      width: 90,
      align: 'right',
    },
    {
      title: '酒店 ID',
      dataIndex: 'hotelId',
      key: 'hotelId',
      width: 90,
    },
    {
      title: '费率代码',
      dataIndex: 'rateCode',
      key: 'rateCode',
      width: 130,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#526383' }}>{v}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, r) => (
        <Tooltip title={`查看请求 ${r.key} 详情`}>
          <Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 6 }}>
            查看
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.h1}>日志查询</h1>
          <p style={styles.subText}>浏览系统捕获的验价和下单错误日志</p>
        </div>
      </div>

      {/* Warning banner */}
      <div style={styles.warnCard}>
        <ClockCircleOutlined style={{ fontSize: 16 }} />
        <span>错误日志仅保留最近 <strong>48 小时</strong>。此页面不受顶部日期筛选器影响。</span>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>操作类型</label>
          <Select
            value={actionFilter}
            onChange={setActionFilter}
            style={{ width: 160 }}
          >
            <Option value="all">全部操作</Option>
            <Option value="验价">验价</Option>
            <Option value="下单">下单</Option>
            <Option value="取消">取消</Option>
          </Select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>错误类型</label>
          <Select
            value={errorTypeFilter}
            onChange={setErrorTypeFilter}
            style={{ width: 160 }}
          >
            <Option value="all">全部类型</Option>
            <Option value="验价错误">验价错误</Option>
            <Option value="下单错误">下单错误</Option>
            <Option value="超时错误">超时错误</Option>
            <Option value="价格变动">价格变动</Option>
            <Option value="取消错误">取消错误</Option>
          </Select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>搜索日志</label>
          <Input
            prefix={<SearchOutlined style={{ color: '#66728a' }} />}
            placeholder="搜索错误信息、酒店ID、费率代码..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 280, borderRadius: 7 }}
          />
        </div>

        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          style={{ alignSelf: 'flex-end', borderRadius: 7, background: '#000947', borderColor: '#000947' }}
        >
          搜索日志
        </Button>
      </div>

      {/* Estimated TTV loss */}
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <WarningOutlined style={{ color: '#ea0345', fontSize: 18 }} />
          <h3 style={{ margin: 0, fontSize: 15, color: '#000947' }}>
            预计损失 TTV：<span style={{ color: '#ea0345' }}>${totalLoss.toLocaleString()}</span>
          </h3>
        </div>
        {/* Horizontal bar chart */}
        <svg viewBox="0 0 900 120" preserveAspectRatio="none"
          style={{ width: '100%', height: 90, display: 'block', overflow: 'visible' }}>
          {['No available room.', 'provider timeout', 'other'].map((name, i) => {
            const val = [Math.round(totalLoss * 0.7), Math.round(totalLoss * 0.22), Math.round(totalLoss * 0.08)][i];
            const barW = (val / totalLoss) * 760;
            return (
              <g key={name}>
                <text x="140" y={22 + i * 38} textAnchor="end" fill="#526078" fontSize="12">{name}</text>
                <rect x="150" y={8 + i * 38} width={Math.max(4, barW)} height={22} rx="3" fill="#4c4597" />
                <text x={155 + Math.max(4, barW)} y={22 + i * 38} fill="#526078" fontSize="12">
                  ${val.toLocaleString()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Log table */}
      <div style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={filtered}
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}
        />
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
    marginBottom: 20,
  },
  h1: {
    margin: '0 0 6px',
    fontSize: 28,
    fontWeight: 800,
    color: '#000947',
    lineHeight: 1.2,
  },
  subText: { margin: 0, color: '#66728a', fontSize: 14 },
  warnCard: {
    background: '#fff9e9',
    border: '1px solid #ffcc53',
    color: '#933e00',
    padding: '10px 16px',
    borderRadius: 8,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    marginBottom: 24,
  },
  filters: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-end',
    flexWrap: 'wrap' as const,
    marginBottom: 24,
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1c2442',
  },
  card: {
    background: '#fff',
    border: '1px solid #dfe5ef',
    borderRadius: 8,
    boxShadow: '0 1px 2px rgba(0,9,71,0.06)',
    padding: 20,
  },
};
