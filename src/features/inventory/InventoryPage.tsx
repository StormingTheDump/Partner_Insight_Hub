import { Download } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { lineOption } from "@/data/chart-options";
import { inventoryDownloads } from "@/data/dashboard";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Button } from "@/shared/components/Button";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";

export function InventoryPage({ showPreviousPeriod }: PageProps) {
  return (
    <>
      <PageHeader title="Inventory" description="Track mapped, available, and sold hotels across feeds." />
      <div className="grid three-col">
        <MetricCard title="Avg Mapped Properties" value="299" caption="Mapped hotels in selected period." />
        <MetricCard title="Avg Available Hotels" value="188" caption="Available properties returned to marketplace." />
        <MetricCard title="Hotels Sold" value="10,599" caption="Sold hotels from current demand." />
      </div>
      <div className="filter-row" style={{ marginTop: 18 }}>
        {inventoryDownloads.map((label) => (
          <Button key={label}>
            <Download className="icon" /> {label}
          </Button>
        ))}
      </div>
      <div className="grid three-col">
        <ChartCard title="Mapped Properties Over Time">
          <BaseChart className="small" option={lineOption("mapped", "Mapped", "", showPreviousPeriod)} />
        </ChartCard>
        <ChartCard title="Available Hotels Over Time">
          <BaseChart className="small" option={lineOption("available", "Available", "", showPreviousPeriod)} />
        </ChartCard>
        <ChartCard title="Sold Hotels Over Time">
          <BaseChart className="small" option={lineOption("sold", "Sold", "", showPreviousPeriod)} />
        </ChartCard>
      </div>
    </>
  );
}

