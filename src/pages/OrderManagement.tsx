import { useState } from 'react';
import { Select, Input, Button, Table, Tag } from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Order {
  key: string;
  orderId: string;
  hotelId: string;
  hotelName: string;
  channel: string;
  price: number;
  status: string;
  checkIn: string;
  checkOut: string;
  bookingDate: string;
  nights: number;
}

const CHANNELS = ['HUB_Dida_B2B', 'HUB_Dida_B2C', 'HUB_Dida_CUG', 'HUB_Dida_Snap'];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed: { label: '已确认', color: 'green' },
  cancelled: { label: '已取消', color: 'red' },
  pending: { label: '待确认', color: 'orange' },
};

const MOCK_ORDERS: Order[] = [
  { key: '1', orderId: '1774107878', hotelId: '40204', hotelName: 'Comfort Inn Downtown', channel: CHANNELS[0], price: 93.00, status: 'confirmed', checkIn: '2026-06-09', checkOut: '2026-06-11', bookingDate: '2026-06-08', nights: 2 },
  { key: '2', orderId: '1774142299', hotelId: '44099', hotelName: 'Hampton Inn & Suites Raleigh Cary', channel: CHANNELS[0], price: 140.63, status: 'confirmed', checkIn: '2026-06-10', checkOut: '2026-06-12', bookingDate: '2026-06-09', nights: 2 },
  { key: '3', orderId: '1774176720', hotelId: '87149', hotelName: 'Hilton Garden Inn Ames', channel: CHANNELS[2], price: 188.26, status: 'confirmed', checkIn: '2026-06-11', checkOut: '2026-06-13', bookingDate: '2026-06-10', nights: 2 },
  { key: '4', orderId: '1774211141', hotelId: '621824', hotelName: 'Hampton Inn Austin/Oak Hill', channel: CHANNELS[0], price: 235.89, status: 'pending', checkIn: '2026-06-12', checkOut: '2026-06-14', bookingDate: '2026-06-10', nights: 2 },
  { key: '5', orderId: '1774245562', hotelId: '991378', hotelName: 'The Lofton Hotel, Tapestry by Hilton', channel: CHANNELS[1], price: 283.52, status: 'confirmed', checkIn: '2026-06-13', checkOut: '2026-06-15', bookingDate: '2026-06-10', nights: 2 },
  { key: '6', orderId: '1774279983', hotelId: '84627', hotelName: 'Hampton Inn Binghamton', channel: CHANNELS[0], price: 331.15, status: 'cancelled', checkIn: '2026-06-07', checkOut: '2026-06-09', bookingDate: '2026-06-05', nights: 2 },
  { key: '7', orderId: '1774314404', hotelId: '48454', hotelName: 'The Wylie Inn and Conference Center', channel: CHANNELS[3], price: 378.78, status: 'confirmed', checkIn: '2026-06-08', checkOut: '2026-06-10', bookingDate: '2026-06-06', nights: 2 },
  { key: '8', orderId: '1774348825', hotelId: '111282', hotelName: 'Hampton Inn Pampa', channel: CHANNELS[0], price: 426.41, status: 'confirmed', checkIn: '2026-06-14', checkOut: '2026-06-16', bookingDate: '2026-06-10', nights: 2 },
  { key: '9', orderId: '1774383246', hotelId: '97131', hotelName: 'Econo Lodge Whiteville', channel: CHANNELS[2], price: 474.04, status: 'pending', checkIn: '2026-06-15', checkOut: '2026-06-17', bookingDate: '2026-06-11', nights: 2 },
  { key: '10', orderId: '1774417667', hotelId: '1012902', hotelName: 'Hilton Garden Inn Springfield', channel: CHANNELS[0], price: 521.67, status: 'confirmed', checkIn: '2026-06-16', checkOut: '2026-06-18', bookingDate: '2026-06-11', nights: 2 },
];

const KPI_CARDS = [
  { label: '总订单数', value: MOCK_ORDERS.length.toString(), color: '#4f5fb8' },
  { label: '已确认', value: MOCK_ORDERS.filter(o => o.status === 'confirmed').length.toString(), color: '#00924c' },
  { label: '待确认', value: MOCK_ORDERS.filter(o => o.status === 'pending').length.toString(), color: '#f97316' },
  { label: '已取消', value: MOCK_ORDERS.filter(o => o.status === 'cancelled').length.toString(), color: '#ea0345' },
  { label: '总收入 (TTV)', value: '$' + MOCK_ORDERS.reduce((s, o) => s + o.price, 0).toFixed(0), color: '#8b35ff' },
];

export default function OrderManagementPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Order[]>(MOCK_ORDERS);

  const handleSearch = () => {
    const result = MOCK_ORDERS.filter((o) => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchChannel = channelFilter === 'all' || o.channel === channelFilter;
      const matchSearch = !search ||
        o.orderId.includes(search) ||
        o.hotelId.includes(search) ||
        o.hotelName.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchChannel && matchSearch;
    });
    setData(result);
  };

  const handleExport = () => {
    const header = 'orderId,hotelId,hotelName,channel,price,status,checkIn,checkOut,bookingDate,nights';
    const rows = data.map(o =>
      `${o.orderId},${o.hotelId},"${o.hotelName}",${o.channel},${o.price},${o.status},${o.checkIn},${o.checkOut},${o.bookingDate},${o.nights}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<Order> = [
    {
      title: '订单 ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 120,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '酒店 ID',
      dataIndex: 'hotelId',
      key: 'hotelId',
      width: 90,
    },
    {
      title: '酒店名称',
      dataIndex: 'hotelName',
      key: 'hotelName',
      render: (v) => <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 180,
      render: (v) => (
        <Tag color="blue" style={{ borderRadius: 6, fontSize: 11 }}>{v}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      align: 'right',
      render: (v) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          ${v.toFixed(2)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v) => {
        const s = STATUS_MAP[v] || { label: v, color: 'default' };
        return <Tag color={s.color} style={{ borderRadius: 6, fontWeight: 600 }}>{s.label}</Tag>;
      },
    },
    {
      title: '入住日期',
      dataIndex: 'checkIn',
      key: 'checkIn',
      width: 110,
    },
    {
      title: '离店日期',
      dataIndex: 'checkOut',
      key: 'checkOut',
      width: 110,
    },
    {
      title: '下单日期',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      width: 110,
    },
    {
      title: '间夜数',
      dataIndex: 'nights',
      key: 'nights',
      width: 80,
      align: 'right',
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.h1}>订单管理</h1>
          <p style={styles.subText}>查看并导出您与 Dida 的订单记录</p>
        </div>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExport}
          style={{ borderRadius: 7, fontWeight: 600, height: 36 }}
        >
          导出 CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div style={styles.kpiGrid}>
        {KPI_CARDS.map((k) => (
          <div key={k.label} style={styles.card}>
            <p style={styles.cardLabel}>{k.label}</p>
            <div style={{ ...styles.metricValue, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>订单状态</label>
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
            <Option value="all">全部状态</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="pending">待确认</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>渠道</label>
          <Select value={channelFilter} onChange={setChannelFilter} style={{ width: 200 }}>
            <Option value="all">全部渠道</Option>
            {CHANNELS.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>搜索</label>
          <Input
            prefix={<SearchOutlined style={{ color: '#66728a' }} />}
            placeholder="订单号 / 酒店ID / 酒店名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 260, borderRadius: 7 }}
          />
        </div>

        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          style={{ alignSelf: 'flex-end', borderRadius: 7, background: '#000947', borderColor: '#000947' }}
        >
          搜索
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={data}
        size="middle"
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 'max-content' }}
        style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 24,
  },
  h1: {
    margin: '0 0 6px',
    fontSize: 28,
    fontWeight: 800,
    color: '#000947',
    lineHeight: 1.2,
  },
  subText: { margin: 0, color: '#66728a', fontSize: 14 },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    background: '#fff',
    border: '1px solid #dfe5ef',
    borderRadius: 8,
    boxShadow: '0 1px 2px rgba(0,9,71,0.06)',
    padding: 20,
    minWidth: 0,
  },
  cardLabel: {
    margin: '0 0 6px',
    color: '#66728a',
    fontSize: 13,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.1,
    fontVariantNumeric: 'tabular-nums',
    color: '#000',
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
};
