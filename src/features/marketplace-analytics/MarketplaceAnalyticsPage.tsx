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
      <PageHeader title="Marketplace Analytics" description="Measure incremental marketplace bookings, TTV, discount, and cost." />
      <div className="grid five-col metric-grid-5">
        <MetricCard title="Marketplace Bookings" value="1,942" delta="+18.2%" />
        <MetricCard title="Marketplace TTV" value="$612,420" delta="+12.4%" />
        <MetricCard title="Avg. Effective Discount" value="0.62%" />
        <MetricCard title="Marketplace cost" value="$18,940" />
        <MetricCard title="Win Rate impact" value="+0.41pp" />
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <ChartCard title="Performance timeline" subtitle="Marketplace TTV and effective discount over time.">
          <BaseChart className="tall" option={comboOption()} />
        </ChartCard>
        <ChartCard title="Price tolerance distribution" subtitle="Booking share by effective discount bucket.">
          <BaseChart className="tall" option={donutOption()} />
        </ChartCard>
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <Card className="insight-card">
          <h3>Performance analysis</h3>
          <p className="tiny">B2B and CUG feeds show the highest incremental TTV response with controlled effective discount.</p>
        </Card>
        <Card className="insight-card">
          <h3>Recommended action</h3>
          <p className="tiny">Keep tolerance below 0.75% for near-term lead times while expanding high-value chain overrides.</p>
        </Card>
      </div>
    </>
  );
}

