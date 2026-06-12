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
      <PageHeader title="库存" description="按渠道追踪已映射、可用及已售出酒店。" />
      <div className="grid three-col">
        <MetricCard title="平均映射房源" value="299" caption="所选时间段内已映射酒店数。" />
        <MetricCard title="平均可用酒店" value="188" caption="返回渠道市场的可用房源数。" />
        <MetricCard title="已售出酒店" value="10,599" caption="当前需求下已售出酒店数。" />
      </div>
      <div className="filter-row" style={{ marginTop: 18 }}>
        {inventoryDownloads.map((label) => (
          <Button key={label}>
            <Download className="icon" /> {label}
          </Button>
        ))}
      </div>
      <div className="grid three-col">
        <ChartCard title="已映射房源趋势">
          <BaseChart className="small" option={lineOption("mapped", "已映射", "", showPreviousPeriod)} />
        </ChartCard>
        <ChartCard title="可用酒店趋势">
          <BaseChart className="small" option={lineOption("available", "可用", "", showPreviousPeriod)} />
        </ChartCard>
        <ChartCard title="已售出酒店趋势">
          <BaseChart className="small" option={lineOption("sold", "已售出", "", showPreviousPeriod)} />
        </ChartCard>
      </div>
    </>
  );
}
