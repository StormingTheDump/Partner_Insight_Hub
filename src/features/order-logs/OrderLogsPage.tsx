import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { orderLogs, type OrderLog } from "@/data/order-logs";
import { includesText } from "@/data/formatters";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { DataTable } from "@/shared/components/DataTable";
import { Drawer } from "@/shared/components/Drawer";
import { SearchFilter } from "@/shared/components/FilterControl";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import type { TableColumn, Tone } from "@/shared/types/table";

function statusTone(value: string): Tone {
  if (value === "已确认" || value === "通过") return "success";
  if (value === "已停止" || value === "无房间") return "danger";
  if (value === "等待供应商" || value === "价格变动" || value === "未尝试") return "warning";
  return "neutral";
}

export function OrderLogsPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OrderLog | null>(null);
  const rows = useMemo(() => orderLogs.filter((row) => includesText([row.orderNo, row.hotel, row.feed, row.priceCheck, row.booking, row.traceIds], query)), [query]);

  const columns: TableColumn<OrderLog>[] = [
    { key: "orderNo", header: "订单号", render: (row) => <strong>{row.orderNo}</strong> },
    { key: "hotel", header: "酒店" },
    { key: "feed", header: "渠道" },
    { key: "priceCheck", header: "价格检查", render: (row) => <StatusPill label={row.priceCheck} tone={statusTone(row.priceCheck)} /> },
    { key: "booking", header: "预订", render: (row) => <StatusPill label={row.booking} tone={statusTone(row.booking)} /> },
    { key: "traceIds", header: "追踪ID" },
    { key: "lastEvent", header: "最近事件" },
    { key: "actions", header: "操作", render: (row) => <Button onClick={() => setSelected(row)}>查看日志</Button> }
  ];

  return (
    <>
      <PageHeader title="订单日志" description="按订单号追踪价格检查及预订全生命周期事件。" />
      <div className="filter-row">
        <SearchFilter icon={<Search className="icon" />} placeholder="搜索订单、酒店、渠道或追踪ID" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <DataTable columns={columns} rows={rows} getRowKey={(row) => row.orderNo} />
      <Drawer open={Boolean(selected)} title={selected?.orderNo ?? "订单日志"} subtitle={selected?.hotel} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="grid">
            <Card compact>
              <div className="card-header">
                <div>
                  <h3>追踪ID</h3>
                  <p className="tiny">{selected.traceIds}</p>
                </div>
                <StatusPill label={selected.booking} tone={statusTone(selected.booking)} />
              </div>
            </Card>
            <section>
              <h3>价格检查日志</h3>
              <div className="timeline" style={{ marginTop: 12 }}>
                {selected.priceCheckLogs.map((event) => (
                  <div className="timeline-item" key={`${event.time}-${event.title}`}>
                    <div className="timeline-time">{event.time}</div>
                    <div className="timeline-card">
                      <strong>{event.title}</strong>
                      <p className="tiny">{event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3>预订日志</h3>
              <div className="timeline" style={{ marginTop: 12 }}>
                {selected.bookingLogs.map((event) => (
                  <div className="timeline-item" key={`${event.time}-${event.title}`}>
                    <div className="timeline-time">{event.time}</div>
                    <div className="timeline-card">
                      <strong>{event.title}</strong>
                      <p className="tiny">{event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
