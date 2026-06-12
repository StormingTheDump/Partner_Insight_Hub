import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppState } from "@/dashboard/app-state";
import { Button } from "@/shared/components/Button";
import { Drawer } from "@/shared/components/Drawer";
import { PageHeader } from "@/shared/components/PageHeader";

// ─── types ────────────────────────────────────────────────────────────────────

type CreditSummary = {
  total_credit: number;
  avail_credit: number;
  consumed_credit: number;
  due_date: string;
};

type PaymentProgress = {
  total_bill_amount: number;
  settled_amount: number;
  pending_amount: number;
  progress_ratio: number;
};

type Bill = {
  bill_no: string;
  client_id: string;
  billing_period: string;
  latest_collection_date: string;
  status: "已逾期" | "部分结账" | "待结账";
  settlement_date: string | null;
  contact: string;
  order_count: number;
  amount: number;
};

type BillDetail = Bill & { finance_contacts: string[] };

// ─── helpers ──────────────────────────────────────────────────────────────────

const FINANCE_CONTACTS = ["jason@dida.com", "lea@dida.com", "lumino@dida.com", "neo@dida.com"];

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

function fmtPeriod(s: string) {
  const [y, m] = s.split("-");
  return `${y}年${Number(m)}月`;
}

function fmtCredit(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M USD`;
  return `$${fmtMoney(n)}`;
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  "已逾期":  { background: "#fce8e6", color: "#ea0345" },
  "部分结账": { background: "#fff4db", color: "#935100" },
  "待结账":  { background: "#e8f0fe", color: "#1a73e8" },
};

// ─── sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ ratio, tone }: { ratio: number; tone: "default" | "warning" | "danger" }) {
  const pct = Math.min(100, Math.max(0, ratio * 100));
  const fillColor =
    tone === "danger" ? "#ea0345" :
    tone === "warning" ? "#f59e0b" :
    "#1a73e8";
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct.toFixed(1)}%`, background: fillColor }} />
    </div>
  );
}

function StatRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, marginTop: 8 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function FinanceStatusPage() {
  const { selectedFeed } = useAppState();

  const [credit, setCredit] = useState<CreditSummary | null>(null);
  const [payment, setPayment] = useState<PaymentProgress | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  // Track last fetched clientId — derive loading from mismatch
  const [fetchedClientId, setFetchedClientId] = useState<string | null>(null);

  const [drawerBill, setDrawerBill] = useState<BillDetail | null>(null);

  const clientId = selectedFeed === "全部渠道" ? "all" : selectedFeed;
  const loading = fetchedClientId !== clientId;

  // Fetch summary + bills whenever the global filter changes
  useEffect(() => {
    const qs = `client_id=${encodeURIComponent(clientId)}`;

    Promise.all([
      fetch(`/api/finance/summary?${qs}`).then(r => r.json()),
      fetch(`/api/finance/unsettled-bills?${qs}`).then(r => r.json()),
    ])
      .then(([summary, billsResp]) => {
        setCredit(summary.credit ?? null);
        setPayment(summary.payment_progress ?? null);
        setBills(billsResp.data ?? []);
        setFetchedClientId(clientId);
      })
      .catch(() => {
        setFetchedClientId(clientId);
      });
  }, [clientId]);

  // Open detail drawer — bills already contain all fields, just append contacts
  function openDetail(bill: Bill) {
    setDrawerBill({ ...bill, finance_contacts: FINANCE_CONTACTS });
  }

  const creditRatio = credit
    ? credit.consumed_credit / credit.total_credit
    : 0;
  const creditTone =
    creditRatio >= 0.85 ? "danger" :
    creditRatio >= 0.70 ? "warning" :
    "default";

  return (
    <>
      <PageHeader
        title="财务信息"
        description="监控信用敞口、付款进度及未结账单详情。"
      />

      {/* ── 4 metric cards ─────────────────────────────────────────────────── */}
      <div className="grid four-col">
        <div className="card compact">
          <p className="muted" style={{ marginBottom: 4 }}>信用额度</p>
          <div className="metric-value">{credit ? fmtCredit(credit.total_credit) : "—"}</div>
        </div>
        <div className="card compact">
          <p className="muted" style={{ marginBottom: 4 }}>可用信用</p>
          <div className="metric-value" style={{ color: "var(--google-green)" }}>
            {credit ? `$${fmtMoney(credit.avail_credit)}` : "—"}
          </div>
        </div>
        <div className="card compact">
          <p className="muted" style={{ marginBottom: 4 }}>已用信用</p>
          <div className="metric-value" style={{ color: "#f59e0b" }}>
            {credit ? `$${fmtMoney(credit.consumed_credit)}` : "—"}
          </div>
        </div>
        <div className="card compact">
          <p className="muted" style={{ marginBottom: 4 }}>额度到期</p>
          <div className="metric-value" style={{ fontSize: 18 }}>
            {credit ? fmtDate(credit.due_date) : "—"}
          </div>
        </div>
      </div>

      {/* ── Two progress cards ──────────────────────────────────────────────── */}
      <div className="grid two-col" style={{ marginTop: 22 }}>
        {/* Credit usage */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>信用使用情况</h3>
              <p className="tiny">
                {credit
                  ? `已使用 $${fmtMoney(credit.total_credit)} 信用额度中的 $${fmtMoney(credit.consumed_credit)}`
                  : "加载中…"}
              </p>
            </div>
            {credit && (
              <span className={`status${creditTone === "danger" ? " danger" : creditTone === "warning" ? " warning" : ""}`}>
                {(creditRatio * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <ProgressBar ratio={creditRatio} tone={creditTone} />
          <p className="tiny" style={{ marginTop: 12 }}>警告阈值为 70%；危险阈值为 85%。</p>
          {credit && (
            <>
              <StatRow label="总信用额度" value={`$${fmtMoney(credit.total_credit)}`} />
              <StatRow label="可用信用" value={`$${fmtMoney(credit.avail_credit)}`} />
              <StatRow label="已用信用" value={`$${fmtMoney(credit.consumed_credit)}`} bold />
            </>
          )}
        </div>

        {/* Payment progress */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>历史账单付款进度</h3>
              <p className="tiny">
                {payment
                  ? `已结账 $${fmtMoney(payment.settled_amount)}，待结 $${fmtMoney(payment.pending_amount)}`
                  : "加载中…"}
              </p>
            </div>
            {payment && (
              <span className="status info">
                {(payment.progress_ratio * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <ProgressBar ratio={payment?.progress_ratio ?? 0} tone="default" />
          <p className="tiny" style={{ marginTop: 12 }}>进度 = 结账金额 ÷ 总账单金额。</p>
          {payment && (
            <>
              <StatRow label="总账单金额" value={`$${fmtMoney(payment.total_bill_amount)}`} />
              <StatRow label="结账金额" value={`$${fmtMoney(payment.settled_amount)}`} bold />
              <StatRow label="待结金额" value={`$${fmtMoney(payment.pending_amount)}`} />
            </>
          )}
        </div>
      </div>

      {/* ── Unsettled bills table ───────────────────────────────────────────── */}
      <div style={{ marginTop: 22 }} className="card">
        <div className="card-header">
          <div>
            <h3>未结账单详情</h3>
            <p className="tiny">
              {loading ? "加载中…" : `共 ${bills.length} 条账单`}
            </p>
          </div>
          <Button
            onClick={() => {
              const csv = [
                "账单编号,Client ID,计费周期,最晚回款时间,状态,结账日期,联系人,订单数,金额",
                ...bills.map(b => [
                  b.bill_no, b.client_id, fmtPeriod(b.billing_period),
                  b.latest_collection_date, b.status,
                  b.settlement_date ?? "", b.contact,
                  b.order_count, b.amount.toFixed(2),
                ].join(",")),
              ].join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              a.download = `finance-bills-${clientId}.csv`;
              a.click();
            }}
            disabled={bills.length === 0}
          >
            <Download className="icon" /> 导出 CSV
          </Button>
        </div>

        <div className="table-wrap" style={{ maxHeight: "calc(100vh - 480px)", overflowY: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 1080,
              tableLayout: "fixed",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <colgroup>
              <col style={{ width: 170 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 70 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr>
                {["账单编号","Client ID","计费周期","最晚回款时间","状态","结账日期","联系人","订单数","金额（USD）","操作"].map(h => (
                  <th
                    key={h}
                    style={{
                      position: "sticky", top: 0, zIndex: 2,
                      background: "#f8fafd", color: "#526078",
                      fontSize: 12, fontWeight: 800,
                      padding: "10px 12px",
                      borderBottom: "2px solid var(--line)",
                      whiteSpace: "nowrap", verticalAlign: "middle",
                      textAlign: h === "金额（USD）" || h === "订单数" ? "right" : "left",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>加载中…</td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>暂无账单数据</td></tr>
              ) : bills.map(bill => (
                <tr key={bill.bill_no} style={{ background: bill.status === "已逾期" ? "#fff5f5" : undefined }}>
                  <td style={TD}>
                    <span style={{ fontFamily: "monospace", fontSize: 12 }}>{bill.bill_no}</span>
                  </td>
                  <td style={TD}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px",
                      borderRadius: 4, background: "#e8f0fe",
                      color: "#1a73e8", fontSize: 12, fontWeight: 600,
                    }}>
                      {bill.client_id}
                    </span>
                  </td>
                  <td style={TD}>{fmtPeriod(bill.billing_period)}</td>
                  <td style={TD}>{fmtDate(bill.latest_collection_date)}</td>
                  <td style={TD}>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "3px 9px", borderRadius: 999,
                      fontSize: 12, fontWeight: 700,
                      ...STATUS_STYLE[bill.status],
                    }}>
                      {bill.status}
                    </span>
                  </td>
                  <td style={TD}>{fmtDate(bill.settlement_date)}</td>
                  <td style={TD}>{bill.contact}</td>
                  <td style={{ ...TD, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {bill.order_count.toLocaleString()}
                  </td>
                  <td style={{ ...TD, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    ${fmtMoney(bill.amount)}
                  </td>
                  <td style={TD}>
                    <button
                      type="button"
                      className="button"
                      style={{ padding: "2px 10px", minHeight: 28, fontSize: 12 }}
                      onClick={() => openDetail(bill)}
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bill detail drawer ──────────────────────────────────────────────── */}
      <Drawer
        open={drawerBill !== null}
        title="账单详情"
        subtitle={drawerBill?.bill_no}
        onClose={() => setDrawerBill(null)}
      >
        {drawerBill && (
          <div style={{ display: "grid", gap: 0 }}>
            {[
              ["账单编号",    drawerBill.bill_no],
              ["Client ID",  drawerBill.client_id],
              ["计费周期",    fmtPeriod(drawerBill.billing_period)],
              ["最晚回款时间", fmtDate(drawerBill.latest_collection_date)],
              ["状态",        drawerBill.status],
              ["结账日期",    fmtDate(drawerBill.settlement_date)],
              ["联系人",      drawerBill.contact],
              ["订单数",      drawerBill.order_count.toLocaleString()],
              ["金额（USD）", `$${fmtMoney(drawerBill.amount)}`],
            ].map(([label, value]) => (
              <div
                key={label as string}
                style={{
                  display: "flex", justifyContent: "space-between", gap: 12,
                  padding: "11px 0", borderBottom: "1px solid var(--line-soft)",
                  fontSize: 14,
                }}
              >
                <span style={{ color: "var(--muted)", flexShrink: 0 }}>{label}</span>
                <span style={{ fontWeight: 600, textAlign: "right" }}>
                  {label === "状态" ? (
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "2px 9px", borderRadius: 999,
                      fontSize: 12, fontWeight: 700,
                      ...STATUS_STYLE[value as string],
                    }}>
                      {value}
                    </span>
                  ) : (
                    value as string
                  )}
                </span>
              </div>
            ))}

            {/* Finance contacts */}
            <div style={{ marginTop: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
                财务联系人
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {drawerBill.finance_contacts.map(email => (
                  <div
                    key={email}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", borderRadius: 8,
                      background: "#f8fafd", border: "1px solid var(--line-soft)",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#17213f" }}>{email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

// ─── shared td style (defined outside component for stability) ────────────────
const TD: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
