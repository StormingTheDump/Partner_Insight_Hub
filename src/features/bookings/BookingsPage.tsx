import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/dashboard/app-state";
import { Button } from "@/shared/components/Button";
import { DataTable } from "@/shared/components/DataTable";
import { SearchFilter } from "@/shared/components/FilterControl";
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
  { key: "client_ref", header: "客户订单号" },
  { key: "dida_ref", header: "DIDA订单号" },
  { key: "channel_status", header: "状态" },
  { key: "client_id", header: "客户ID" },
  { key: "dida_hotel_id", header: "DIDA酒店ID" },
  { key: "client_hotel_id", header: "客户酒店ID" },
  { key: "dida_hotel_name", header: "酒店名称" },
  { key: "price", header: "价格", align: "right" },
  { key: "channel_create_time", header: "创建时间" },
  { key: "checkin_date", header: "入住日期" },
  { key: "checkout_date", header: "退房日期" },
];

function parseBatch(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BookingsPage() {
  const { selectedFeed, dateRange } = useAppState();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientRefQuery, setClientRefQuery] = useState("");
  const [didaRefQuery, setDidaRefQuery] = useState("");

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

    const clientRefs = parseBatch(clientRefQuery);
    if (clientRefs.length > 0) {
      result = result.filter((r) => clientRefs.includes(r.client_ref));
    }

    const didaRefs = parseBatch(didaRefQuery);
    if (didaRefs.length > 0) {
      result = result.filter((r) => didaRefs.includes(r.dida_ref));
    }

    return result;
  }, [rows, selectedFeed, dateRange, clientRefQuery, didaRefQuery]);

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
      <div className="filter-row">
        <SearchFilter
          icon={<Search className="icon" />}
          placeholder="client_ref 精确匹配（逗号或换行分隔）"
          value={clientRefQuery}
          onChange={(e) => setClientRefQuery(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <SearchFilter
          icon={<Search className="icon" />}
          placeholder="dida_ref 精确匹配（逗号或换行分隔）"
          value={didaRefQuery}
          onChange={(e) => setDidaRefQuery(e.target.value)}
          style={{ minWidth: 260 }}
        />
      </div>
      {loading ? (
        <div className="empty-state">加载中…</div>
      ) : (
        <DataTable columns={columns} rows={filteredRows} getRowKey={(row) => row.client_ref} />
      )}
    </>
  );
}
