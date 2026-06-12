import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { PageProps } from "@/dashboard/routes";
import { stackedBookingsOption } from "@/data/chart-options";
import { performanceRows } from "@/data/dashboard";
import { includesText } from "@/data/formatters";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Button } from "@/shared/components/Button";
import { ChartCard } from "@/shared/components/ChartCard";
import { DataTable } from "@/shared/components/DataTable";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { SearchFilter } from "@/shared/components/FilterControl";
import type { TableColumn } from "@/shared/types/table";

const columns: TableColumn<(typeof performanceRows)[number]>[] = [
  { key: "feed", header: "Feed" },
  { key: "wins", header: "Wins", align: "right" },
  { key: "opportunities", header: "Opportunities", align: "right" },
  { key: "winRate", header: "Win rate", align: "right" },
  { key: "status", header: "Status" }
];

export function PerformancePage({ selectedFeed }: PageProps) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => performanceRows.filter((row) => (selectedFeed === "All feeds" || row.feed === selectedFeed) && includesText(Object.values(row), query)),
    [query, selectedFeed]
  );

  return (
    <>
      <PageHeader
        title="Performance"
        description="Track booking volume, win rate, room nights, and revenue by feed."
        actions={
          <Button>
            <Download className="icon" /> Export data to CSV
          </Button>
        }
      />
      <div className="filter-row">
        <SearchFilter icon={<Search className="icon" />} placeholder="Search feeds" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="filter-control" type="button">All chains</button>
        <button className="filter-control" type="button">All lead times</button>
        <button className="filter-control" type="button">All refundability</button>
      </div>
      <div className="grid metric-grid-5">
        <MetricCard title="Total Bookings" value="10,599" />
        <MetricCard title="Total Revenue (TTV)" value="$3,532,888" />
        <MetricCard title="Avg Booking Value" value="$333" />
        <MetricCard title="Room Nights" value="21,907" />
        <MetricCard title="Win Rate" value="2.7%" />
      </div>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="Bookings Over Time" subtitle="Stacked bookings by feed.">
          <BaseChart className="tall" option={stackedBookingsOption(false)} />
        </ChartCard>
      </div>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="Win Rate by feed" subtitle="Compare wins and opportunities by source feed.">
          <DataTable columns={columns} rows={rows} getRowKey={(row) => row.feed} />
        </ChartCard>
      </div>
    </>
  );
}

