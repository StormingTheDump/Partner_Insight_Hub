import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/dashboard/app-state";
import { Button } from "@/shared/components/Button";
import { DataTable } from "@/shared/components/DataTable";
import { PageHeader } from "@/shared/components/PageHeader";
import { useCsvExport } from "@/shared/hooks/useCsvExport";
import type { TableColumn } from "@/shared/types/table";

type OrderRow = {
  client_ref: string;
  dida_ref: string;
  channel_status: string;
  client_id: string;
  dida_hotel_id: string;
  client_hotel_id: string;
  dida_hotel_name: string;
  price: number;
  channel_create_time: string;
  checkin_date: string;
  checkout_date: string;
};

const columns: TableColumn<OrderRow>[] = [
  { key: "client_ref", header: "client_ref" },
  { key: "dida_ref", header: "dida_ref" },
  { key: "channel_status", header: "channel_status" },
  { key: "client_id", header: "client_id" },
  { key: "dida_hotel_id", header: "dida_hotel_id" },
  { key: "client_hotel_id", header: "client_hotel_id" },
  { key: "dida_hotel_name", header: "dida_hotel_name" },
  { key: "price", header: "price", align: "right" },
  { key: "channel_create_time", header: "channel_create_time" },
  { key: "checkin_date", header: "checkin_date" },
  { key: "checkout_date", header: "checkout_date" },
];

function parseBatch(input: string): string[] {
  return input
    .split(/[\n, ]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BookingsPage() {
  const { selectedFeed, dateRange } = useAppState();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderQuery, setOrderQuery] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(({ data }: { data: OrderRow[] }) => setRows(data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => {
    let result = rows;

    if (selectedFeed !== "全部渠道") {
      result = result.filter((r) => r.client_id === selectedFeed);
    }

    if (dateRange) {
      const [start, end] = dateRange;
      result = result.filter((r) => {
        const d = r.channel_create_time.slice(0, 10);
        return d >= start && d <= end;
      });
    }

    const refs = parseBatch(orderQuery);
    if (refs.length > 0) {
      result = result.filter(
        (r) => refs.includes(r.client_ref) || refs.includes(r.dida_ref)
      );
    }

    return result;
  }, [rows, selectedFeed, dateRange, orderQuery]);

  const exportCsv = useCsvExport("dida-bookings.csv", columns, filteredRows);

  return (
    <>
      <PageHeader
        title="订单管理"
        description="查看您在平台上与 DIDA 的所有订单。"
        actions={
          <Button onClick={exportCsv} disabled={!filteredRows.length}>
            <Download className="icon" /> 导出 CSV
          </Button>
        }
      />
      <div className="filter-row" style={{ alignItems: "flex-start" }}>
        <label className="filter-control" style={{ alignItems: "flex-start", paddingTop: 7, paddingBottom: 7 }}>
          <Search className="icon" style={{ marginTop: 2, flexShrink: 0 }} />
          <textarea
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            placeholder="支持任意订单号检索（逗号、空格或换行分隔批量查询）"
            rows={2}
            style={{
              border: 0,
              outline: 0,
              background: "transparent",
              resize: "vertical",
              minWidth: 320,
              fontFamily: "inherit",
              fontSize: "inherit",
              color: "inherit",
              lineHeight: 1.45,
            }}
          />
        </label>
      </div>
      {loading ? (
        <div className="empty-state">加载中…</div>
      ) : (
        <DataTable columns={columns} rows={filteredRows} getRowKey={(row) => row.client_ref} />
      )}
    </>
  );
}
