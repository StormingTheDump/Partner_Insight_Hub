import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { bookingRows } from "@/data/bookings";
import { includesText } from "@/data/formatters";
import { Button } from "@/shared/components/Button";
import { DataTable } from "@/shared/components/DataTable";
import { SearchFilter } from "@/shared/components/FilterControl";
import { PageHeader } from "@/shared/components/PageHeader";
import { useCsvExport } from "@/shared/hooks/useCsvExport";
import type { TableColumn } from "@/shared/types/table";

const columns: TableColumn<(typeof bookingRows)[number]>[] = [
  { key: "id", header: "订单ID" },
  { key: "hotelId", header: "酒店ID" },
  { key: "hotelName", header: "酒店名称" },
  { key: "feed", header: "渠道" },
  { key: "price", header: "价格", align: "right" },
  { key: "adjustment", header: "调整比例" },
  { key: "amount", header: "调整金额" },
  { key: "checkIn", header: "入住日期" },
  { key: "bookingDate", header: "预订日期" }
];

export function BookingsPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => bookingRows.filter((row) => includesText(Object.values(row), query)), [query]);
  const exportCsv = useCsvExport("dida-bookings.csv", columns, rows);

  return (
    <>
      <PageHeader
        title="订单管理"
        description="查看您在平台上的所有订单。"
        actions={
          <Button onClick={exportCsv} disabled={!rows.length}>
            <Download className="icon" /> 导出 CSV
          </Button>
        }
      />
      <div className="filter-row">
        <SearchFilter icon={<Search className="icon" />} placeholder="搜索订单" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} />
    </>
  );
}
