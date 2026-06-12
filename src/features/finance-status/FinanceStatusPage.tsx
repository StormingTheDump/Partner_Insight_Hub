import type { PageProps } from "@/dashboard/routes";
import { bills, financeSummary, settlementCalendar } from "@/data/finance";
import { Card } from "@/shared/components/Card";
import { DataTable } from "@/shared/components/DataTable";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import type { TableColumn, Tone } from "@/shared/types/table";

const billColumns: TableColumn<(typeof bills)[number]>[] = [
  { key: "id", header: "Bill ID" },
  { key: "period", header: "Billing period" },
  { key: "dueDate", header: "Due date" },
  { key: "type", header: "Type" },
  { key: "bookings", header: "Bookings", align: "right" },
  { key: "amount", header: "Amount", align: "right" },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusPill label={row.status} tone={row.status === "At risk" ? "danger" : row.status === "Due soon" ? "warning" : "info"} />
  },
  { key: "aging", header: "Aging" },
  { key: "owner", header: "Owner" },
  { key: "actions", header: "Actions", render: () => <button className="button" type="button">View</button> }
];

export function FinanceStatusPage(_: PageProps) {
  return (
    <>
      <PageHeader title="Finance Status" description="Monitor credit exposure, upcoming settlement events, and unsettled bills." />
      <div className="grid four-col">
        {financeSummary.map((item) => (
          <MetricCard key={item.title} title={item.title} value={item.value} tone={item.tone as Parameters<typeof MetricCard>[0]["tone"]} />
        ))}
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <Card>
          <div className="card-header">
            <div>
              <h3>Credit utilization</h3>
              <p className="tiny">$1.46M used of $2.50M credit limit.</p>
            </div>
            <span className="status warning">58.4%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "58.4%" }} />
          </div>
          <p className="tiny" style={{ marginTop: 12 }}>
            Alert threshold starts at 70%; danger threshold starts at 85%.
          </p>
        </Card>
        <Card>
          <h3>Settlement calendar</h3>
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
              <h3>Unsettled bill details</h3>
              <p className="tiny">Open and at-risk bills by period, amount, owner, and aging.</p>
            </div>
          </div>
          <DataTable columns={billColumns} rows={bills} getRowKey={(row) => row.id} />
        </Card>
      </div>
    </>
  );
}

