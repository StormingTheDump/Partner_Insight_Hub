import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Download,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PageProps } from "@/dashboard/routes";
import { useAppState } from "@/dashboard/app-state";
import { Button } from "@/shared/components/Button";
import { Drawer } from "@/shared/components/Drawer";
import { PageHeader } from "@/shared/components/PageHeader";
import "./FinanceStatusPage.css";

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
  progress_ratio?: number;
};

type BillStatus = "已逾期" | "已结清" | "待结账";

type Bill = {
  bill_no: string;
  client_id: string;
  billing_period: string;
  latest_collection_date: string;
  status: BillStatus;
  settlement_date: string | null;
  contact: string;
  order_count: number;
  amount: number;
};

type BillDetail = Bill & { finance_contacts: string[] };

const FINANCE_CONTACTS = ["jason@dida.com", "lea@dida.com", "lumino@dida.com", "neo@dida.com"];
const DEMO_TODAY = new Date("2026-06-17T00:00:00");

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function fmtDate(s: string | null) {
  if (!s) return "-";
  const [y, m, d] = s.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

function fmtPeriod(s: string) {
  const [y, m] = s.split("-");
  return `${y}年${Number(m)}月`;
}

function ratio(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(1, Math.max(0, part / total));
}

function daysBetween(date: string | null, from = DEMO_TODAY) {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - from.getTime()) / 86_400_000);
}

function isOverdue(status: string) {
  return status === "已逾期";
}

function statusClass(status: string) {
  if (status === "已逾期") return "status danger";
  if (status === "待结账") return "status warning";
  if (status === "已结清") return "status";
  return "status neutral";
}

function creditTone(creditRatio: number) {
  if (creditRatio >= 0.85) return "danger";
  if (creditRatio >= 0.7) return "warning";
  return "info";
}

function ProgressBar({
  ratio: value,
  tone = "info",
  showThresholds = false,
}: {
  ratio: number;
  tone?: "info" | "warning" | "danger" | "success";
  showThresholds?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, value * 100));

  return (
    <div className="finance-progress-wrap">
      <div className="finance-progress-track">
        <div className={`finance-progress-fill ${tone}`} style={{ width: `${pct.toFixed(1)}%` }} />
      </div>
      {showThresholds ? (
        <>
          <span className="finance-threshold warn"><span>70%</span></span>
          <span className="finance-threshold danger"><span>85%</span></span>
        </>
      ) : null}
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: string; tone?: "primary" | "success" | "danger" }) {
  return (
    <div className="finance-stat-row">
      <span>{label}</span>
      <strong className={tone ? `is-${tone}` : undefined}>{value}</strong>
    </div>
  );
}

function KpiCard({
  label,
  value,
  badge,
  tone,
  risk = false,
}: {
  label: string;
  value: string;
  badge: string;
  tone?: "info" | "warning" | "danger" | "success";
  risk?: boolean;
}) {
  return (
    <article className={risk ? "finance-kpi-card risk" : "finance-kpi-card"}>
      <div className="finance-kpi-head">
        <span>{label}</span>
        <span className={`status ${tone ?? "info"}`}>{badge}</span>
      </div>
      <div className={risk ? "finance-kpi-value is-danger" : "finance-kpi-value"}>{value}</div>
    </article>
  );
}

export function FinanceStatusPage(_: PageProps) {
  const { selectedFeed } = useAppState();
  const [credit, setCredit] = useState<CreditSummary | null>(null);
  const [payment, setPayment] = useState<PaymentProgress | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [fetchedClientId, setFetchedClientId] = useState<string | null>(null);
  const [drawerBill, setDrawerBill] = useState<BillDetail | null>(null);

  const clientId = selectedFeed === "全部渠道" ? "all" : selectedFeed;
  const clientLabel = clientId === "all" ? "全部渠道" : clientId;
  const loading = fetchedClientId !== clientId;

  useEffect(() => {
    const qs = `client_id=${encodeURIComponent(clientId)}`;
    Promise.all([
      fetch(`/api/finance/summary?${qs}`).then((r) => r.json()),
      fetch(`/api/finance/unsettled-bills?${qs}`).then((r) => r.json()),
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

  const creditRatio = credit ? ratio(credit.consumed_credit, credit.total_credit) : 0;
  const paymentRatio = payment
    ? payment.progress_ratio ?? ratio(payment.settled_amount, payment.total_bill_amount)
    : 0;
  const overdueBills = useMemo(() => bills.filter((bill) => isOverdue(bill.status)), [bills]);
  const overdueAmount = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);
  const sortedBills = useMemo(
    () =>
      [...bills].sort((a, b) => {
        if (isOverdue(a.status) !== isOverdue(b.status)) return isOverdue(a.status) ? -1 : 1;
        return a.latest_collection_date.localeCompare(b.latest_collection_date);
      }),
    [bills],
  );
  const creditDueDays = daysBetween(credit?.due_date ?? null);
  const tone = creditTone(creditRatio);

  function openDetail(bill: Bill) {
    setDrawerBill({ ...bill, finance_contacts: FINANCE_CONTACTS });
  }

  function exportCsv() {
    const csv = [
      "账单编号,Client ID,计费周期,最晚回款时间,状态,结算日期,联系人,订单数,金额",
      ...sortedBills.map((bill) =>
        [
          bill.bill_no,
          bill.client_id,
          fmtPeriod(bill.billing_period),
          bill.latest_collection_date,
          bill.status,
          bill.settlement_date ?? "",
          bill.contact,
          bill.order_count,
          bill.amount.toFixed(2),
        ].join(","),
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `finance-bills-${clientId}.csv`;
    a.click();
  }

  return (
    <div className="finance-status-page">
      <PageHeader
        title="财务信息"
        actions={
          <Button variant="primary" onClick={exportCsv} disabled={bills.length === 0}>
            <Download className="icon" /> 导出 CSV
          </Button>
        }
      />

      <section className={`finance-risk-notice${overdueBills.length === 0 ? " is-clear" : ""}`}>
        <div className="finance-risk-copy">
          <span className="finance-risk-icon">
            {overdueBills.length > 0 ? <AlertTriangle className="icon" /> : <CheckCircle2 className="icon" />}
          </span>
          {loading ? (
            <span>加载中</span>
          ) : overdueBills.length > 0 ? (
            <span>
              逾期账单 <strong>{overdueBills.length}</strong> 条 · <strong>${fmtMoney(overdueAmount)}</strong>
            </span>
          ) : (
            <span>无逾期账单</span>
          )}
        </div>
        <Button onClick={() => overdueBills[0] && openDetail(overdueBills[0])} disabled={overdueBills.length === 0}>
          查看逾期
        </Button>
      </section>

      <section className="finance-kpi-grid" aria-label="财务关键指标">
        <KpiCard
          label="总信用额度"
          value={credit ? `$${fmtInt(credit.total_credit)}` : "-"}
          badge="Credit"
          tone="info"
        />
        <KpiCard
          label="可用额度"
          value={credit ? `$${fmtInt(credit.avail_credit)}` : "-"}
          badge={creditRatio >= 0.85 ? "紧张" : "健康"}
          tone={creditRatio >= 0.85 ? "danger" : "success"}
        />
        <KpiCard
          label="已用额度"
          value={credit ? `$${fmtInt(credit.consumed_credit)}` : "-"}
          badge={`${(creditRatio * 100).toFixed(1)}%`}
          tone={tone}
        />
        <KpiCard
          label="额度到期"
          value={credit ? fmtDate(credit.due_date) : "-"}
          badge={creditDueDays !== null && creditDueDays >= 0 ? `${creditDueDays} 天` : "待确认"}
          tone={creditDueDays !== null && creditDueDays < 7 ? "warning" : "info"}
        />
        <KpiCard
          label="逾期账单"
          value={String(overdueBills.length)}
          badge={overdueBills.length > 0 ? "需处理" : "正常"}
          tone={overdueBills.length > 0 ? "danger" : "success"}
          risk={overdueBills.length > 0}
        />
      </section>

      <section className="finance-progress-grid">
        <article className="finance-panel">
          <div className="finance-panel-header">
            <div className="finance-panel-title">
              <span className="finance-icon-tile"><CreditCard className="icon" /></span>
            </div>
            <span className={`status ${tone}`}>{(creditRatio * 100).toFixed(1)}%</span>
          </div>
          <ProgressBar ratio={creditRatio} tone={tone} showThresholds />
          {credit ? (
            <div className="finance-stat-list">
              <StatRow label="总信用额度" value={`$${fmtMoney(credit.total_credit)}`} />
              <StatRow label="可用信用" value={`$${fmtMoney(credit.avail_credit)}`} />
              <StatRow label="已用信用" value={`$${fmtMoney(credit.consumed_credit)}`} tone="primary" />
            </div>
          ) : null}
        </article>

        <article className="finance-panel">
          <div className="finance-panel-header">
            <div className="finance-panel-title">
              <span className="finance-icon-tile"><WalletCards className="icon" /></span>
            </div>
            <span className="status info">{(paymentRatio * 100).toFixed(1)}%</span>
          </div>
          <ProgressBar ratio={paymentRatio} tone="info" />
          {payment ? (
            <div className="finance-stat-list">
              <StatRow label="总账单金额" value={`$${fmtMoney(payment.total_bill_amount)}`} />
              <StatRow label="已结金额" value={`$${fmtMoney(payment.settled_amount)}`} tone="success" />
              <StatRow label="待结金额" value={`$${fmtMoney(payment.pending_amount)}`} />
            </div>
          ) : null}
        </article>
      </section>

      <section className="finance-ledger-card">
        <div className="finance-ledger-header">
          <div className="finance-filter-group">
            <span className="finance-filter-pill">状态：全部</span>
            <span className="finance-filter-pill">Client：{clientLabel}</span>
            <span className="finance-filter-pill">账期：近 30 天</span>
          </div>
        </div>

        <div className="finance-ledger-table">
          <table>
            <thead>
              <tr>
                <th>账单编号</th>
                <th>Client ID</th>
                <th>计费周期</th>
                <th>最晚回款</th>
                <th>状态</th>
                <th className="num">订单数</th>
                <th className="num">金额 (USD)</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="finance-table-state">加载中</td></tr>
              ) : sortedBills.length === 0 ? (
                <tr><td colSpan={8} className="finance-table-state">暂无账单数据</td></tr>
              ) : (
                sortedBills.map((bill) => (
                  <tr
                    className={isOverdue(bill.status) ? "finance-ledger-row finance-risk-row" : "finance-ledger-row"}
                    key={bill.bill_no}
                  >
                    <td className="finance-mono">{bill.bill_no}</td>
                    <td><span className="finance-client-token">{bill.client_id}</span></td>
                    <td>{fmtPeriod(bill.billing_period)}</td>
                    <td>{fmtDate(bill.latest_collection_date)}</td>
                    <td><span className={statusClass(bill.status)}>{bill.status}</span></td>
                    <td className="num">{bill.order_count.toLocaleString()}</td>
                    <td className="num finance-money">${fmtMoney(bill.amount)}</td>
                    <td>
                      <Button className="finance-small-button" onClick={() => openDetail(bill)}>
                        查看
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Drawer
        open={drawerBill !== null}
        title="账单详情"
        subtitle={drawerBill?.bill_no}
        onClose={() => setDrawerBill(null)}
      >
        {drawerBill ? (
          <div className="finance-drawer-summary">
            <div className="finance-drawer-hero">
              <span className={statusClass(drawerBill.status)}>{drawerBill.status}</span>
              <h3 className="finance-mono">{drawerBill.bill_no}</h3>
              <strong>${fmtMoney(drawerBill.amount)}</strong>
            </div>

            <div className="finance-stat-list">
              <StatRow label="最晚回款时间" value={fmtDate(drawerBill.latest_collection_date)} />
              <StatRow label="结算日期" value={fmtDate(drawerBill.settlement_date)} />
              <StatRow label="订单数" value={drawerBill.order_count.toLocaleString()} />
              <StatRow label="财务负责人" value={drawerBill.contact} />
              <StatRow label="Client ID" value={drawerBill.client_id} />
            </div>

            <div className="finance-contact-list">
              {drawerBill.finance_contacts.map((email) => (
                <span className="finance-contact-pill" key={email}>{email}</span>
              ))}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
