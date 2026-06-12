import type { PageProps } from "@/dashboard/routes";
import { comboOption, hotelChainOption, simpleBarOption } from "@/data/chart-options";
import { BaseChart } from "@/shared/charts/BaseChart";
import { ChartCard } from "@/shared/components/ChartCard";
import { PageHeader } from "@/shared/components/PageHeader";

export function CostAnalysisPage(_: PageProps) {
  return (
    <>
      <PageHeader title="成本分析" description="按预订维度分析渠道市场成本、折扣及交易额。" />
      <div className="filter-row">
        <button className="filter-control" type="button">全部连锁</button>
        <button className="filter-control" type="button">全部提前期</button>
        <button className="filter-control" type="button">全部退款类型</button>
      </div>
      <ChartCard title="渠道市场交易额与有效折扣">
        <BaseChart className="tall" option={comboOption()} />
      </ChartCard>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <ChartCard title="按退款类型">
          <BaseChart className="small" option={simpleBarOption(["不可退款", "可退款"], [0.62, 0.6], 0.8)} />
        </ChartCard>
        <ChartCard title="按提前期">
          <BaseChart className="small" option={simpleBarOption(["0-1天", "2-7天", "8-30天", "31天以上"], [0.75, 0.78, 0.58, 0.71], 0.8)} />
        </ChartCard>
      </div>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="按酒店连锁">
          <BaseChart className="tall" option={hotelChainOption()} />
        </ChartCard>
      </div>
    </>
  );
}
