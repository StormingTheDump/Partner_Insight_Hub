import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { PageProps } from "@/dashboard/routes";
import { bookingRows } from "@/data/bookings";
import { includesText } from "@/data/formatters";
import { Button } from "@/shared/components/Button";
import { DataTable } from "@/shared/components/DataTable";
import { SearchFilter } from "@/shared/components/FilterControl";
import { PageHeader } from "@/shared/components/PageHeader";
import { useCsvExport } from "@/shared/hooks/useCsvExport";
import type { TableColumn } from "@/shared/types/table";

const columns: TableColumn<(typeof bookingRows)[number]>[] = [
  { key: "id", header: "ID" },
  { key: "hotelId", header: "Hotel ID" },
  { key: "hotelName", header: "Hotel Name" },
  { key: "feed", header: "Feed" },
  { key: "price", header: "Price", align: "right" },
  { key: "adjustment", header: "Adjustment %" },
  { key: "amount", header: "Adj. amount" },
  { key: "checkIn", header: "Check-in" },
  { key: "bookingDate", header: "Booking date" }
];

export function BookingsPage(_: PageProps) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => bookingRows.filter((row) => includesText(Object.values(row), query)), [query]);
  const exportCsv = useCsvExport("dida-bookings.csv", columns, rows);

  return (
    <>
      <PageHeader
        title="Bookings"
        description="View your bookings with Nuitee."
        actions={
          <Button onClick={exportCsv} disabled={!rows.length}>
            <Download className="icon" /> Export to CSV
          </Button>
        }
      />
      <div className="filter-row">
        <SearchFilter icon={<Search className="icon" />} placeholder="Search bookings" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} />
    </>
  );
}

