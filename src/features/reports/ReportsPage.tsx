import type { PageProps } from "@/dashboard/routes";
import { Card } from "@/shared/components/Card";
import { PageHeader } from "@/shared/components/PageHeader";

const REPORT_TEMPLATES = [
  { icon: "📊", title: "月度业绩报表",    desc: "按 Client ID 汇总每月订单量、营收、胜出率。" },
  { icon: "📅", title: "周度订单报表",    desc: "近7天各渠道订单明细，含间夜数与平均订单价值。" },
  { icon: "🏆", title: "Client ID 对比",  desc: "6个 Client ID 横向对比核心指标。" },
  { icon: "⚠️", title: "错误率分析报表",  desc: "预订前与预订错误按渠道与时间段分类汇总。" },
];

export function ReportsPage(_: PageProps) {
  return (
    <>
      <PageHeader title="自定义报表" description="定时报表模板及自定义导出，覆盖 Agoda 全部 6 个 Client ID。" />
      <div className="grid two-col">
        {REPORT_TEMPLATES.map((t) => (
          <Card key={t.title}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>{t.icon}</span>
              <div>
                <h3 style={{ margin: "0 0 6px" }}>{t.title}</h3>
                <p className="tiny" style={{ margin: "0 0 14px" }}>{t.desc}</p>
                <span className="status warning" style={{ fontSize: 11 }}>即将上线</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

