import { useState, useMemo } from 'react';
import { Table, Tag, Button, Space, Select, Tooltip, Typography } from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  BellOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import * as XLSX from 'xlsx';

const { Text } = Typography;

interface BillRecord {
  key: string;
  billNo: string;
  clientId: string;
  billingPeriod: string;
  dueDate: string;
  type: string;
  orderCount: number;
  amount: number;
  status: '已结清' | '未结清' | '逾期未付' | '待确认';
  agingDays: number;
  manager: string;
}

const CLIENT_IDS = ['Agoda', 'AgodaUK', 'AgodaEBK', 'Lvzan', 'Barli2b', 'DidaOpaq'];

const MOCK_DATA: BillRecord[] = [
  { key: '1',  billNo: 'INV-2026-0531-001', clientId: 'Agoda',     billingPeriod: '2026-05-01 ~ 2026-05-31', dueDate: '2026-06-10', type: '月结账单', orderCount: 1250, amount: 328500, status: '逾期未付', agingDays: 2,  manager: '张伟' },
  { key: '2',  billNo: 'INV-2026-0531-002', clientId: 'AgodaUK',   billingPeriod: '2026-05-01 ~ 2026-05-31', dueDate: '2026-06-10', type: '月结账单', orderCount: 832,  amount: 214600, status: '已结清',  agingDays: 0,  manager: '李娜' },
  { key: '3',  billNo: 'INV-2026-0531-003', clientId: 'AgodaEBK',  billingPeriod: '2026-05-01 ~ 2026-05-31', dueDate: '2026-06-10', type: '月结账单', orderCount: 456,  amount: 98700,  status: '未结清',  agingDays: 2,  manager: '王芳' },
  { key: '4',  billNo: 'INV-2026-0531-004', clientId: 'Lvzan',     billingPeriod: '2026-05-01 ~ 2026-05-31', dueDate: '2026-06-20', type: '月结账单', orderCount: 234,  amount: 56800,  status: '未结清',  agingDays: 0,  manager: '赵磊' },
  { key: '5',  billNo: 'INV-2026-0531-005', clientId: 'Barli2b',   billingPeriod: '2026-05-01 ~ 2026-05-31', dueDate: '2026-06-20', type: '月结账单', orderCount: 189,  amount: 42300,  status: '待确认',  agingDays: 0,  manager: '陈静' },
  { key: '6',  billNo: 'INV-2026-0531-006', clientId: 'DidaOpaq',  billingPeriod: '2026-05-01 ~ 2026-05-31', dueDate: '2026-06-20', type: '月结账单', orderCount: 312,  amount: 78900,  status: '未结清',  agingDays: 0,  manager: '张伟' },
  { key: '7',  billNo: 'INV-2026-0524-007', clientId: 'Agoda',     billingPeriod: '2026-05-18 ~ 2026-05-24', dueDate: '2026-06-03', type: '周结账单', orderCount: 287,  amount: 72400,  status: '已结清',  agingDays: 0,  manager: '李娜' },
  { key: '8',  billNo: 'INV-2026-0524-008', clientId: 'AgodaUK',   billingPeriod: '2026-05-18 ~ 2026-05-24', dueDate: '2026-06-03', type: '周结账单', orderCount: 164,  amount: 39800,  status: '已结清',  agingDays: 0,  manager: '李娜' },
  { key: '9',  billNo: 'INV-2026-0531-009', clientId: 'AgodaEBK',  billingPeriod: '2026-05-25 ~ 2026-05-31', dueDate: '2026-06-03', type: '周结账单', orderCount: 98,   amount: 23100,  status: '逾期未付', agingDays: 9,  manager: '王芳' },
  { key: '10', billNo: 'INV-2026-0531-010', clientId: 'Lvzan',     billingPeriod: '2026-05-25 ~ 2026-05-31', dueDate: '2026-06-03', type: '周结账单', orderCount: 52,   amount: 12600,  status: '已结清',  agingDays: 0,  manager: '赵磊' },
  { key: '11', billNo: 'INV-2026-0531-011', clientId: 'Barli2b',   billingPeriod: '2026-05-25 ~ 2026-05-31', dueDate: '2026-06-03', type: '周结账单', orderCount: 41,   amount: 9800,   status: '逾期未付', agingDays: 9,  manager: '陈静' },
  { key: '12', billNo: 'INV-2026-0531-012', clientId: 'DidaOpaq',  billingPeriod: '2026-05-25 ~ 2026-05-31', dueDate: '2026-06-03', type: '周结账单', orderCount: 76,   amount: 18400,  status: '已结清',  agingDays: 0,  manager: '张伟' },
  { key: '13', billNo: 'INV-2026-0605-013', clientId: 'Agoda',     billingPeriod: '2026-06-01 ~ 2026-06-05', dueDate: '2026-06-12', type: '日结账单', orderCount: 215,  amount: 54300,  status: '待确认',  agingDays: 0,  manager: '张伟' },
  { key: '14', billNo: 'INV-2026-0605-014', clientId: 'AgodaUK',   billingPeriod: '2026-06-01 ~ 2026-06-05', dueDate: '2026-06-12', type: '日结账单', orderCount: 143,  amount: 36700,  status: '未结清',  agingDays: 0,  manager: '李娜' },
  { key: '15', billNo: 'INV-2026-0605-015', clientId: 'AgodaEBK',  billingPeriod: '2026-06-01 ~ 2026-06-05', dueDate: '2026-06-12', type: '日结账单', orderCount: 87,   amount: 19200,  status: '未结清',  agingDays: 0,  manager: '王芳' },
  { key: '16', billNo: 'INV-2026-0605-016', clientId: 'Lvzan',     billingPeriod: '2026-06-01 ~ 2026-06-05', dueDate: '2026-06-12', type: '日结账单', orderCount: 43,   amount: 10500,  status: '待确认',  agingDays: 0,  manager: '赵磊' },
  { key: '17', billNo: 'INV-2026-PRE-017',  clientId: 'Barli2b',   billingPeriod: '2026-05-13 ~ 2026-06-12', dueDate: '2026-05-20', type: '预付款',   orderCount: 0,    amount: 50000,  status: '已结清',  agingDays: 0,  manager: '陈静' },
  { key: '18', billNo: 'INV-2026-PRE-018',  clientId: 'DidaOpaq',  billingPeriod: '2026-05-13 ~ 2026-06-12', dueDate: '2026-05-20', type: '预付款',   orderCount: 0,    amount: 80000,  status: '已结清',  agingDays: 0,  manager: '张伟' },
  { key: '19', billNo: 'INV-2026-REF-019',  clientId: 'Agoda',     billingPeriod: '2026-05-15 ~ 2026-05-15', dueDate: '2026-05-22', type: '退款',     orderCount: 18,   amount: -4500,  status: '已结清',  agingDays: 0,  manager: '李娜' },
  { key: '20', billNo: 'INV-2026-SUP-020',  clientId: 'AgodaEBK',  billingPeriod: '2026-05-01 ~ 2026-05-31', dueDate: '2026-06-07', type: '补款',     orderCount: 23,   amount: 5800,   status: '逾期未付', agingDays: 5,  manager: '王芳' },
  { key: '21', billNo: 'INV-2026-0610-021', clientId: 'Agoda',     billingPeriod: '2026-06-06 ~ 2026-06-10', dueDate: '2026-06-17', type: '日结账单', orderCount: 198,  amount: 49600,  status: '未结清',  agingDays: 0,  manager: '张伟' },
  { key: '22', billNo: 'INV-2026-0610-022', clientId: 'AgodaUK',   billingPeriod: '2026-06-06 ~ 2026-06-10', dueDate: '2026-06-17', type: '日结账单', orderCount: 127,  amount: 32100,  status: '未结清',  agingDays: 0,  manager: '李娜' },
  { key: '23', billNo: 'INV-2026-0610-023', clientId: 'DidaOpaq',  billingPeriod: '2026-06-06 ~ 2026-06-10', dueDate: '2026-06-17', type: '日结账单', orderCount: 69,   amount: 16800,  status: '未结清',  agingDays: 0,  manager: '张伟' },
];

const STATUS_CONFIG: Record<BillRecord['status'], { color: string; text: string }> = {
  '已结清':  { color: 'success', text: '已结清' },
  '未结清':  { color: 'processing', text: '未结清' },
  '逾期未付': { color: 'error', text: '逾期未付' },
  '待确认':  { color: 'warning', text: '待确认' },
};

const TYPE_COLORS: Record<string, string> = {
  '月结账单': 'blue',
  '周结账单': 'cyan',
  '日结账单': 'geekblue',
  '预付款':  'purple',
  '退款':    'orange',
  '补款':    'gold',
};

export default function FinancePage() {
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return MOCK_DATA.filter(r => {
      if (clientFilter !== 'all' && r.clientId !== clientFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      return true;
    });
  }, [clientFilter, statusFilter, typeFilter]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, r) => sum + r.amount, 0),
    [filtered],
  );
  const overdueCount = useMemo(
    () => filtered.filter(r => r.status === '逾期未付').length,
    [filtered],
  );

  function handleExport() {
    const rows = filtered.map(r => ({
      账单编号: r.billNo,
      Client_ID: r.clientId,
      计费周期: r.billingPeriod,
      到期日: r.dueDate,
      类型: r.type,
      订单数: r.orderCount,
      金额: r.amount,
      状态: r.status,
      账龄: r.agingDays > 0 ? `${r.agingDays}天` : '-',
      负责人: r.manager,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 22 }, { wch: 12 }, { wch: 26 }, { wch: 12 },
      { wch: 10 }, { wch: 8 },  { wch: 12 }, { wch: 10 },
      { wch: 8 },  { wch: 8 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '财务信息');
    XLSX.writeFile(wb, `Agoda财务账单_近30天_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const columns: TableColumnsType<BillRecord> = [
    {
      title: '账单编号',
      dataIndex: 'billNo',
      width: 200,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      width: 110,
      render: (v: string) => <Tag color="blue" style={{ fontWeight: 600 }}>{v}</Tag>,
    },
    {
      title: '计费周期',
      dataIndex: 'billingPeriod',
      width: 210,
      render: (v: string) => <span style={{ fontSize: 12, color: '#5a6482' }}>{v}</span>,
    },
    {
      title: '到期日',
      dataIndex: 'dueDate',
      width: 110,
      sorter: (a, b) => a.dueDate.localeCompare(b.dueDate),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (v: string) => <Tag color={TYPE_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      width: 80,
      align: 'right',
      sorter: (a, b) => a.orderCount - b.orderCount,
      render: (v: number) => v === 0 ? '-' : v.toLocaleString(),
    },
    {
      title: '金额（元）',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (v: number) => (
        <span style={{ color: v < 0 ? '#EF4444' : 'var(--text)', fontWeight: 600 }}>
          {v < 0 ? '-' : ''}¥{Math.abs(v).toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: BillRecord['status']) => {
        const cfg = STATUS_CONFIG[v];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '账龄',
      dataIndex: 'agingDays',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.agingDays - b.agingDays,
      render: (v: number) =>
        v > 0
          ? <span style={{ color: '#EF4444', fontWeight: 700 }}>{v}天</span>
          : <span style={{ color: '#94A3B8' }}>-</span>,
    },
    {
      title: '负责人',
      dataIndex: 'manager',
      width: 80,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      render: (_: unknown, record: BillRecord) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="下载账单">
            <Button size="small" icon={<DownloadOutlined />} />
          </Tooltip>
          {(record.status === '逾期未付' || record.status === '未结清') && (
            <Tooltip title="催款">
              <Button size="small" danger icon={<BellOutlined />} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>财务信息</div>
          <div style={styles.subtitle}>
            Parent Client: <strong>Agoda</strong> · 近30天账单 · 共 {filtered.length} 条
          </div>
        </div>
        <Button
          type="primary"
          icon={<FileExcelOutlined />}
          onClick={handleExport}
          style={{ background: '#10B981', borderColor: '#10B981' }}
        >
          导出 Excel
        </Button>
      </div>

      {/* Summary cards */}
      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>总金额</div>
          <div style={{ ...styles.cardValue, color: '#505AAC' }}>
            ¥{totalAmount.toLocaleString()}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>账单总数</div>
          <div style={styles.cardValue}>{filtered.length}</div>
        </div>
        <div style={{ ...styles.card, borderColor: overdueCount > 0 ? '#ffccc7' : '#E5E7EB' }}>
          <div style={styles.cardLabel}>逾期账单</div>
          <div style={{ ...styles.cardValue, color: overdueCount > 0 ? '#EF4444' : '#94A3B8' }}>
            {overdueCount}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>已结清</div>
          <div style={{ ...styles.cardValue, color: '#52c41a' }}>
            {filtered.filter(r => r.status === '已结清').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <Select
          value={clientFilter}
          onChange={setClientFilter}
          style={{ width: 140 }}
          options={[
            { value: 'all', label: '全部 Client' },
            ...CLIENT_IDS.map(id => ({ value: id, label: id })),
          ]}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部状态' },
            { value: '已结清', label: '已结清' },
            { value: '未结清', label: '未结清' },
            { value: '逾期未付', label: '逾期未付' },
            { value: '待确认', label: '待确认' },
          ]}
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部类型' },
            { value: '月结账单', label: '月结账单' },
            { value: '周结账单', label: '周结账单' },
            { value: '日结账单', label: '日结账单' },
            { value: '预付款', label: '预付款' },
            { value: '退款', label: '退款' },
            { value: '补款', label: '补款' },
          ]}
        />
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <Table<BillRecord>
          columns={columns}
          dataSource={filtered}
          size="small"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 15, showSizeChanger: false, showTotal: total => `共 ${total} 条` }}
          rowClassName={(r) => r.status === '逾期未付' ? 'row-overdue' : ''}
        />
      </div>

      <style>{`
        .row-overdue td { background: #fff2f0 !important; }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text)',
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 10,
    padding: '14px 18px',
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 600,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--text)',
    lineHeight: 1,
  },
  filters: {
    display: 'flex',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap' as const,
  },
  tableWrap: {
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
};
