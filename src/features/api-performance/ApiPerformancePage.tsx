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
      <PageHeader title="API 性能" description="按渠道监控预订请求量、成功率及错误影响。" />
      <Card>
        <div className="card-header" style={{ justifyContent: "flex-start" }}>
          <div className="icon-tile orange">
            <CircleAlert className="icon" />
          </div>
          <div>
            <h3>技术错误对交易额的影响</h3>
            <p className="tiny">可用性、价格变动、超时及供应商确认错误造成的预估交易额损失。</p>
          </div>
          <div className="metric-value" style={{ marginLeft: "auto" }}>
            $58,500
          </div>
        </div>
      </Card>
      <div style={{ marginTop: 22 }}>
        <ChartCard title="技术性能质量趋势" subtitle="优、良、中、差质量区间。">
          <BaseChart className="tall" option={qualityOption()} />
        </ChartCard>
      </div>
      <div className="grid four-col" style={{ marginTop: 22 }}>
        <MetricCard title="预订前错误率" value="7.36%" tone="red" />
        <MetricCard title="预订错误率" value="5.71%" tone="orange" />
        <MetricCard title="总预订前次数" value="299K" />
        <MetricCard title="总订单量" value="10,599" />
      </div>
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <ChartCard title="预订前错误率趋势">
          <BaseChart className="small" option={lineOption("preError", "预订前错误", "%", showPreviousPeriod)} />
        </ChartCard>
        <ChartCard title="预订错误率趋势">
          <BaseChart className="small" option={lineOption("bookError", "预订错误", "%", showPreviousPeriod)} />
        </ChartCard>
      </div>
    </>
  );
}
