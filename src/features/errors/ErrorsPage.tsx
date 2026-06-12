import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { PageProps } from "@/dashboard/routes";
import { horizontalLossOption } from "@/data/chart-options";
import { errorRows } from "@/data/dashboard";
import { includesText } from "@/data/formatters";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { DataTable } from "@/shared/components/DataTable";
import { SearchFilter } from "@/shared/components/FilterControl";
import { PageHeader } from "@/shared/components/PageHeader";
import type { TableColumn } from "@/shared/types/table";

const columns: TableColumn<(typeof errorRows)[number]>[] = [
  { key: "date", header: "Date" },
  { key: "source", header: "Source" },
  { key: "action", header: "Action" },
  { key: "errorType", header: "Error Type" },
  { key: "message", header: "Supplier Message" },
  { key: "errors", header: "Errors", align: "right" },
  { key: "leadTime", header: "Lead time" },
  { key: "hotelId", header: "Hotel ID" },
  { key: "rateCode", header: "Rate Code" },
  { key: "actions", header: "Actions", render: () => <Button>View details</Button> }
];

export function ErrorsPage(_: PageProps) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => errorRows.filter((row) => includesText(Object.values(row), query)), [query]);

  return (
    <>
      <PageHeader
        title="Errors"
        description="Inspect recent supplier errors and their estimated revenue impact."
        actions={
          <Button>
            <Download className="icon" /> Export errors
          </Button>
        }
      />
      <Card>
        <strong>48-hour log window</strong>
        <p className="tiny">Detailed supplier logs are retained in this prototype for the latest 48 hours.</p>
      </Card>
      <div className="filter-row" style={{ marginTop: 18 }}>
        <button className="filter-control" type="button">Action</button>
        <button className="filter-control" type="button">Error Type</button>
        <button className="filter-control" type="button">Source</button>
        <button className="filter-control" type="button">Lead time</button>
        <SearchFilter icon={<Search className="icon" />} placeholder="Search in logs" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <ChartCard title="TTV loss by error reason" subtitle="Estimated loss grouped by supplier message.">
        <BaseChart className="small" option={horizontalLossOption()} />
      </ChartCard>
      <div style={{ marginTop: 22 }}>
        <DataTable columns={columns} rows={rows} getRowKey={(row) => `${row.date}-${row.hotelId}`} />
      </div>
    </>
  );
}

