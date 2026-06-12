import type { PageProps } from "@/dashboard/routes";
import { comboOption, hotelChainOption, simpleBarOption } from "@/data/chart-options";
import { BaseChart } from "@/shared/charts/BaseChart";
import { ChartCard } from "@/shared/components/ChartCard";
import { PageHeader } from "@/shared/components/PageHeader";

export function CostAnalysisPage(_: PageProps) {
  return (
    <>
      <PageHeader title="Cost Analysis" description="Analyze marketplace cost, discount, and TTV by booking dimension." />
      <div className="filter-row">
        <button className="filter-control" type="button">All chains</button>
        <button className="filter-control" type="button">All lead times</button>
        <button className="filter-control" type="button">All refundability</button>
      </div>
      <ChartCard title="Marketplace TTV and effective discount">
        <BaseChart className="tall" option={comboOption()} />
      </ChartCard>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <ChartCard title="By refundable type">
          <BaseChart className="small" option={simpleBarOption(["Non-refundable", "Refundable"], [0.62, 0.6], 0.8)} />
        </ChartCard>
        <ChartCard title="By lead time">
          <BaseChart className="small" option={simpleBarOption(["0-1 days", "2-7 days", "8-30 days", "31+ days"], [0.75, 0.78, 0.58, 0.71], 0.8)} />
        </ChartCard>
      </div>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="By hotel chain">
          <BaseChart className="tall" option={hotelChainOption()} />
        </ChartCard>
      </div>
    </>
  );
}

