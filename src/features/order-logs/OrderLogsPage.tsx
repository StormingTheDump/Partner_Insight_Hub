import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { PageProps } from "@/dashboard/routes";
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
  if (value === "Confirmed" || value === "Passed") return "success";
  if (value === "Stopped" || value === "No room") return "danger";
  if (value === "Pending supplier" || value === "Price changed" || value === "Not attempted") return "warning";
  return "neutral";
}

export function OrderLogsPage(_: PageProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OrderLog | null>(null);
  const rows = useMemo(() => orderLogs.filter((row) => includesText([row.orderNo, row.hotel, row.feed, row.priceCheck, row.booking, row.traceIds], query)), [query]);

  const columns: TableColumn<OrderLog>[] = [
    { key: "orderNo", header: "Order No.", render: (row) => <strong>{row.orderNo}</strong> },
    { key: "hotel", header: "Hotel" },
    { key: "feed", header: "Feed" },
    { key: "priceCheck", header: "Price-check", render: (row) => <StatusPill label={row.priceCheck} tone={statusTone(row.priceCheck)} /> },
    { key: "booking", header: "Booking", render: (row) => <StatusPill label={row.booking} tone={statusTone(row.booking)} /> },
    { key: "traceIds", header: "Trace IDs" },
    { key: "lastEvent", header: "Last event" },
    { key: "actions", header: "Actions", render: (row) => <Button onClick={() => setSelected(row)}>View logs</Button> }
  ];

  return (
    <>
      <PageHeader title="Order Logs" description="Trace price-check and booking lifecycle events by order number." />
      <div className="filter-row">
        <SearchFilter icon={<Search className="icon" />} placeholder="Search order, hotel, feed, or trace" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <DataTable columns={columns} rows={rows} getRowKey={(row) => row.orderNo} />
      <Drawer open={Boolean(selected)} title={selected?.orderNo ?? "Order logs"} subtitle={selected?.hotel} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="grid">
            <Card compact>
              <div className="card-header">
                <div>
                  <h3>Trace IDs</h3>
                  <p className="tiny">{selected.traceIds}</p>
                </div>
                <StatusPill label={selected.booking} tone={statusTone(selected.booking)} />
              </div>
            </Card>
            <section>
              <h3>Price-check logs</h3>
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
              <h3>Booking logs</h3>
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

