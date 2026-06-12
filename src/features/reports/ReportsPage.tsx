import type { PageProps } from "@/dashboard/routes";
import { Card } from "@/shared/components/Card";
import { PageHeader } from "@/shared/components/PageHeader";

export function ReportsPage(_: PageProps) {
  return (
    <>
      <PageHeader title="自定义报表" description="定时报表模板及自定义导出。" />
      <Card>
        <h3>自定义报表</h3>
        <p className="tiny">该模块即将上线。可在此配置报表模板和定时导出任务。</p>
      </Card>
    </>
  );
}
