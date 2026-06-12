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
      <PageHeader title="概览" description="监控供应商交易额、订单量、错误率及渠道市场增长指标。" />
      <div className="overview-grid">
        <div className="grid">
          <Card>
            <div className="card-header">
              <div>
                <h3>季度预测</h3>
                <p className="tiny">含渠道市场影响的预测。</p>
              </div>
              <button className="button green" type="button">
                通过渠道市场提升交易额
              </button>
            </div>
            <div className="grid forecast-grid">
              <Card compact soft>
                <div className="card-header">
                  <strong>2026年Q2</strong>
                  <span className="muted tiny">剩余天数：21</span>
                </div>
                <div className="metric-value big">$8,063,330</div>
                <p className="tiny">当前预测</p>
              </Card>
              <Card compact soft>
                <div className="card-header">
                  <strong>渠道市场预测</strong>
                  <span className="muted tiny">潜在增幅</span>
                </div>
                <div className="metric-value big">
                  $11,645,006 <span className="delta">+44.4%</span>
                </div>
                <p className="tiny">含渠道市场影响的预测</p>
              </Card>
            </div>
          </Card>

          <ChartCard title="交易额趋势" metric="$3,532,888" subtitle="所选时间段内的总交易额。">
            <BaseChart className="tall" option={lineOption("ttv", "交易额", "K", showPreviousPeriod)} />
          </ChartCard>

          <div className="grid two-col">
            <ChartCard title="胜出率" metric="2.70%">
              <BaseChart className="small" option={lineOption("win", "胜出率", "%", showPreviousPeriod)} />
            </ChartCard>
            <ChartCard title="总订单量" metric="10,599">
              <BaseChart className="small" option={lineOption("bookings", "订单量", "", showPreviousPeriod)} />
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
                  caption={`所选时间段内${metric.title}的最新变动。`}
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
              <DollarSign className="icon" /> 关键时期洞察
            </h3>
            <p className="tiny">2026年5月11日至6月10日期间，交易额增长1.53%，订单量下降8.23%。</p>
          </Card>
          <Card className="insight-card">
            <h3>
              <Target className="icon" /> 挖掘高价值渠道 <span className="priority">高优先级</span>
            </h3>
            <p className="tiny">重点提升平均订单价值最高渠道的份额。</p>
            <p className="delta tiny">约提升交易额 10-15%</p>
            <div className="action-list">
              <div>分析客户画像</div>
              <div>制定精准营销活动吸引同类客户</div>
            </div>
          </Card>
          <Card className="insight-card">
            <h3>
              <Target className="icon" /> 提升高峰日订单量 <span className="priority medium">中优先级</span>
            </h3>
            <p className="tiny">分析高峰日交易额高的影响因素，优化渠道市场出价策略。</p>
            <p className="delta tiny">约增加订单量 5-10%</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
