import { Bed, Calendar, CircleAlert, DollarSign, Target, TrendingUp } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { lineOption, sparkOption } from "@/data/chart-options";
import { overviewMetrics } from "@/data/dashboard";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { MetricCard } from "@/shared/components/MetricCard";
import { PageHeader } from "@/shared/components/PageHeader";

const metricIcons = [TrendingUp, Calendar, TrendingUp, Bed, CircleAlert, CircleAlert];
const metricTones = ["purple", "default", "purple", "orange", "red", "orange"] as const;

export function OverviewPage({ showPreviousPeriod }: PageProps) {
  return (
    <>
      <PageHeader title="Overview" description="Monitor supplier transaction value, bookings, error rate, and marketplace growth signals." />
      <div className="overview-grid">
        <div className="grid">
          <Card>
            <div className="card-header">
              <div>
                <h3>Quarterly forecast</h3>
                <p className="tiny">Forecast incl. Marketplace impact.</p>
              </div>
              <button className="button green" type="button">
                Boost your TTV with the Marketplace
              </button>
            </div>
            <div className="grid forecast-grid">
              <Card compact soft>
                <div className="card-header">
                  <strong>Q2 2026</strong>
                  <span className="muted tiny">Remaining days: 21</span>
                </div>
                <div className="metric-value big">$8,063,330</div>
                <p className="tiny">Current forecast</p>
              </Card>
              <Card compact soft>
                <div className="card-header">
                  <strong>Marketplace forecast</strong>
                  <span className="muted tiny">Potential uplift</span>
                </div>
                <div className="metric-value big">
                  $11,645,006 <span className="delta">+44.4%</span>
                </div>
                <p className="tiny">Forecast incl. Marketplace impact</p>
              </Card>
            </div>
          </Card>

          <ChartCard title="TTV over time" metric="$3,532,888" subtitle="Total transaction value in the selected period.">
            <BaseChart className="tall" option={lineOption("ttv", "TTV", "K", showPreviousPeriod)} />
          </ChartCard>

          <div className="grid two-col">
            <ChartCard title="Win Rate" metric="2.70%">
              <BaseChart className="small" option={lineOption("win", "Win Rate", "%", showPreviousPeriod)} />
            </ChartCard>
            <ChartCard title="Total Bookings" metric="10,599">
              <BaseChart className="small" option={lineOption("bookings", "Bookings", "", showPreviousPeriod)} />
            </ChartCard>
          </div>

          <div className="grid two-col">
            {overviewMetrics.slice(2).map((metric, index) => {
              const Icon = metricIcons[index + 2];
              return (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  icon={Icon}
                  tone={metricTones[index + 2]}
                  caption={`Latest ${metric.title.toLowerCase()} movement in the selected period.`}
                >
                  <BaseChart className="spark" option={sparkOption(metric.key as Parameters<typeof sparkOption>[0])} />
                </MetricCard>
              );
            })}
          </div>
        </div>

        <aside className="insight-rail">
          <Card className="insight-card">
            <h3>
              <DollarSign className="icon" /> Key period insight
            </h3>
            <p className="tiny">During 2026-05-11 to 2026-06-10, TTV increased by 1.53% while bookings decreased by 8.23%.</p>
          </Card>
          <Card className="insight-card">
            <h3>
              <Target className="icon" /> Leverage high-value channels <span className="priority">high</span>
            </h3>
            <p className="tiny">Focus on increasing share from the channel with the highest average booking value.</p>
            <p className="delta tiny">~ 10-15% TTV increase</p>
            <div className="action-list">
              <div>Analyze customer demographics</div>
              <div>Tailor campaigns to attract similar customers</div>
            </div>
          </Card>
          <Card className="insight-card">
            <h3>
              <Target className="icon" /> Boost bookings on peak days <span className="priority medium">medium</span>
            </h3>
            <p className="tiny">Identify factors contributing to high TTV on peak days and align marketplace bids.</p>
            <p className="delta tiny">~ 5-10% more bookings</p>
          </Card>
        </aside>
      </div>
    </>
  );
}

