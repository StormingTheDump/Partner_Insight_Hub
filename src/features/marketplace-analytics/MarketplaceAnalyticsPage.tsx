import type { PageProps } from "@/dashboard/routes";
import { comboOption, donutOption } from "@/data/chart-options";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";

export function MarketplaceAnalyticsPage(_: PageProps) {
  return (
    <>
      <PageHeader title="数据分析" description="衡量渠道市场增量订单、交易额、折扣及成本。" />
      <div className="grid five-col metric-grid-5">
        <MetricCard title="渠道市场订单" value="1,942" delta="+18.2%" />
        <MetricCard title="渠道市场交易额" value="$612,420" delta="+12.4%" />
        <MetricCard title="平均有效折扣" value="0.62%" />
        <MetricCard title="渠道市场成本" value="$18,940" />
        <MetricCard title="胜出率影响" value="+0.41pp" />
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <ChartCard title="绩效时间线" subtitle="渠道市场交易额及有效折扣趋势。">
          <BaseChart className="tall" option={comboOption()} />
        </ChartCard>
        <ChartCard title="价格容差分布" subtitle="按有效折扣区间划分的订单份额。">
          <BaseChart className="tall" option={donutOption()} />
        </ChartCard>
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <Card className="insight-card">
          <h3>绩效分析</h3>
          <p className="tiny">B2B和CUG渠道在可控有效折扣下表现出最高的增量交易额响应。</p>
        </Card>
        <Card className="insight-card">
          <h3>推荐操作</h3>
          <p className="tiny">在短期提前期内将容差保持在0.75%以下，同时扩展高价值连锁覆盖。</p>
        </Card>
      </div>
    </>
  );
}
