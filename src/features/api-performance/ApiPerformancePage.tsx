import { CircleAlert } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { lineOption, qualityOption } from "@/data/chart-options";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";

export function ApiPerformancePage({ showPreviousPeriod }: PageProps) {
  return (
    <>
      <PageHeader title="API Performance" description="Monitor pre-book and booking request volume, success rates, and error impact by feed." />
      <Card>
        <div className="card-header" style={{ justifyContent: "flex-start" }}>
          <div className="icon-tile orange">
            <CircleAlert className="icon" />
          </div>
          <div>
            <h3>Technical Errors Impact on TTV</h3>
            <p className="tiny">Estimated TTV loss from availability, price-change, timeout, and supplier confirmation errors.</p>
          </div>
          <div className="metric-value" style={{ marginLeft: "auto" }}>
            $58,500
          </div>
        </div>
      </Card>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="Technical Performance Quality Over Time" subtitle="Great, good, fair, and degraded quality bands.">
          <BaseChart className="tall" option={qualityOption()} />
        </ChartCard>
      </div>
      <div className="grid four-col" style={{ marginTop: 22 }}>
        <MetricCard title="Pre-Book Error Rate" value="7.36%" tone="red" />
        <MetricCard title="Booking Error Rate" value="5.71%" tone="orange" />
        <MetricCard title="Total Pre-Books" value="299K" />
        <MetricCard title="Total Bookings" value="10,599" />
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <ChartCard title="Pre-Book Error Rate Over Time">
          <BaseChart className="small" option={lineOption("preError", "Pre-book error", "%", showPreviousPeriod)} />
        </ChartCard>
        <ChartCard title="Booking Error Rate Over Time">
          <BaseChart className="small" option={lineOption("bookError", "Booking error", "%", showPreviousPeriod)} />
        </ChartCard>
      </div>
    </>
  );
}

