import type { PageProps } from "@/dashboard/routes";
import { bills, financeSummary, settlementCalendar } from "@/data/finance";
import { Card } from "@/shared/components/Card";
import { DataTable } from "@/shared/components/DataTable";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import type { TableColumn, Tone } from "@/shared/types/table";

const billColumns: TableColumn<(typeof bills)[number]>[] = [
  { key: "id", header: "账单编号" },
  { key: "period", header: "计费周期" },
  { key: "dueDate", header: "到期日" },
  { key: "type", header: "类型" },
  { key: "bookings", header: "订单数", align: "right" },
  { key: "amount", header: "金额", align: "right" },
  {
    key: "status",
    header: "状态",
    render: (row) => <StatusPill label={row.status} tone={row.status === "高风险" ? "danger" : row.status === "即将到期" ? "warning" : "info"} />
  },
  { key: "aging", header: "账龄" },
  { key: "owner", header: "负责人" },
  { key: "actions", header: "操作", render: () => <button className="button" type="button">查看</button> }
];

export function FinanceStatusPage(_: PageProps) {
  return (
    <>
      <PageHeader title="财务信息" description="监控信用敞口、即将到来的结算事件及未结账单。" />
      <div className="grid four-col">
        {financeSummary.map((item) => (
          <MetricCard key={item.title} title={item.title} value={item.value} tone={item.tone as Parameters<typeof MetricCard>[0]["tone"]} />
        ))}
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <Card>
          <div className="card-header">
            <div>
              <h3>信用使用情况</h3>
              <p className="tiny">已使用$2.50M信用额度中的$1.46M。</p>
            </div>
            <span className="status warning">58.4%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "58.4%" }} />
          </div>
          <p className="tiny" style={{ marginTop: 12 }}>
            警告阈值为70%；危险阈值为85%。
          </p>
        </Card>
        <Card>
          <h3>结算日历</h3>
          <div className="action-list">
            {settlementCalendar.map((item) => (
              <div key={item.date} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>
                  <strong>{item.date}</strong> {item.label}
                </span>
                <StatusPill label={item.tone} tone={item.tone as Tone} />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div style={{ marginTop: 22 }}>
        <Card>
          <div className="card-header">
            <div>
              <h3>未结账单详情</h3>
              <p className="tiny">按期间、金额、负责人及账龄划分的未结及高风险账单。</p>
            </div>
          </div>
          <DataTable columns={billColumns} rows={bills} getRowKey={(row) => row.id} />
        </Card>
      </div>
    </>
  );
}
