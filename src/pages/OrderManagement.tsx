import { useState } from 'react';
import { Download, Search } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

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

const TH: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 2,
  background: "#f8fafd", color: "#526078",
  fontSize: 12, fontWeight: 800,
  padding: "11px 13px",
  borderBottom: "2px solid var(--line)",
  whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left",
};

const TD: React.CSSProperties = {
  padding: "11px 13px",
  borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle",
  textAlign: "left",
  whiteSpace: "nowrap",
};

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

  const statusBadgeClass = (status: string) => {
    if (status === 'confirmed') return 'status';
    if (status === 'pending') return 'status warning';
    if (status === 'cancelled') return 'status danger';
    return 'status neutral';
  };

  return (
    <div>
      <PageHeader
        title="订单管理"
        description="查看并导出您与 Dida 的订单记录"
        actions={
          <button className="button" onClick={handleExport}>
            <Download size={14} /> 导出 CSV
          </button>
        }
      />

      {/* KPI grid */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 16, marginBottom: 24 }}>
        {KPI_CARDS.map((k) => (
          <div key={k.label} className="card compact">
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>{k.label}</p>
            <div className="metric-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-row">
        <label className="filter-control">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">全部状态</option>
            <option value="confirmed">已确认</option>
            <option value="pending">待确认</option>
            <option value="cancelled">已取消</option>
          </select>
        </label>
        <label className="filter-control">
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
            <option value="all">全部渠道</option>
            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="订单号 / 酒店ID / 酒店名称..."
          />
        </label>
        <button className="button primary" onClick={handleSearch}><Search size={14} /> 搜索</button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={TH}>订单 ID</th>
              <th style={TH}>酒店 ID</th>
              <th style={TH}>酒店名称</th>
              <th style={TH}>渠道</th>
              <th style={{ ...TH, textAlign: "right" }}>金额</th>
              <th style={TH}>状态</th>
              <th style={TH}>入住日期</th>
              <th style={TH}>离店日期</th>
              <th style={TH}>下单日期</th>
              <th style={{ ...TH, textAlign: "right" }}>间夜数</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => {
              const s = STATUS_MAP[o.status] || { label: o.status, color: 'default' };
              return (
                <tr key={o.key}>
                  <td style={TD}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{o.orderId}</span>
                  </td>
                  <td style={TD}>{o.hotelId}</td>
                  <td style={TD}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{o.hotelName}</span>
                  </td>
                  <td style={TD}>
                    <span className="status info">{o.channel}</span>
                  </td>
                  <td style={{ ...TD, textAlign: "right" }}>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                      ${o.price.toFixed(2)}
                    </span>
                  </td>
                  <td style={TD}>
                    <span className={statusBadgeClass(o.status)}>{s.label}</span>
                  </td>
                  <td style={TD}>{o.checkIn}</td>
                  <td style={TD}>{o.checkOut}</td>
                  <td style={TD}>{o.bookingDate}</td>
                  <td style={{ ...TD, textAlign: "right" }}>{o.nights}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
