import { useState } from 'react';
import { Search, AlertTriangle, Clock } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

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

const actionBadgeClass = (action: string) => {
  if (action === '验价') return 'status info';
  if (action === '下单') return 'status';
  if (action === '取消') return 'status warning';
  return 'status neutral';
};

const errorTypeBadgeClass = (errorType: string) => {
  if (errorType === '验价错误') return 'status danger';
  if (errorType === '下单错误') return 'status warning';
  if (errorType === '超时错误') return 'status warning';
  if (errorType === '价格变动') return 'status warning';
  if (errorType === '取消错误') return 'status neutral';
  return 'status neutral';
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

  return (
    <div>
      <PageHeader
        title="日志查询"
        description="浏览系统捕获的验价和下单错误日志"
      />

      {/* Warning banner */}
      <div style={{
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
      }}>
        <Clock size={16} />
        <span>错误日志仅保留最近 <strong>48 小时</strong>。此页面不受顶部日期筛选器影响。</span>
      </div>

      {/* Filter bar */}
      <div className="filter-row">
        <label className="filter-control">
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">全部操作</option>
            <option value="验价">验价</option>
            <option value="下单">下单</option>
            <option value="取消">取消</option>
          </select>
        </label>
        <label className="filter-control">
          <select value={errorTypeFilter} onChange={(e) => setErrorTypeFilter(e.target.value)}>
            <option value="all">全部类型</option>
            <option value="验价错误">验价错误</option>
            <option value="下单错误">下单错误</option>
            <option value="超时错误">超时错误</option>
            <option value="价格变动">价格变动</option>
            <option value="取消错误">取消错误</option>
          </select>
        </label>
        <label className="filter-control">
          <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索错误信息、酒店ID、费率代码..."
          />
        </label>
        <button className="button primary" onClick={handleSearch}><Search size={14} /> 搜索日志</button>
      </div>

      {/* Estimated TTV loss */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <AlertTriangle size={18} style={{ color: "var(--dida-red)" }} />
          <h3 style={{ margin: 0, fontSize: 15, color: "var(--text)" }}>
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={TH}>时间</th>
                <th style={TH}>来源</th>
                <th style={TH}>操作</th>
                <th style={TH}>错误类型</th>
                <th style={TH}>供应商信息</th>
                <th style={{ ...TH, textAlign: "right" }}>错误数</th>
                <th style={{ ...TH, textAlign: "right" }}>提前天数</th>
                <th style={TH}>酒店 ID</th>
                <th style={TH}>费率代码</th>
                <th style={TH}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.key}>
                  <td style={TD}>
                    <div>{r.date}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.time}</div>
                  </td>
                  <td style={TD}>
                    <span style={{ fontWeight: 600 }}>{r.source}</span>
                  </td>
                  <td style={TD}>
                    <span className={actionBadgeClass(r.action)}>{r.action}</span>
                  </td>
                  <td style={TD}>
                    <span className={errorTypeBadgeClass(r.errorType)}>{r.errorType}</span>
                  </td>
                  <td style={TD}>
                    <div>{r.supplierMessage}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.detail}</div>
                  </td>
                  <td style={{ ...TD, textAlign: "right" }}>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{r.errorCount}</span>
                  </td>
                  <td style={{ ...TD, textAlign: "right" }}>{r.leadTime}</td>
                  <td style={TD}>{r.hotelId}</td>
                  <td style={TD}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#526078" }}>{r.rateCode}</span>
                  </td>
                  <td style={TD}>
                    <button className="button" style={{ minHeight: 28, padding: "0 10px", fontSize: 12 }}>查看</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
