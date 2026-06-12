import type { PageProps } from "@/dashboard/routes";
import { Card } from "@/shared/components/Card";
import { PageHeader } from "@/shared/components/PageHeader";

export function ReportsPage(_: PageProps) {
  return (
    <>
      <PageHeader title="Custom Reports" description="Scheduled report templates and custom exports." />
      <Card>
        <h3>Custom Reports</h3>
        <p className="tiny">This module is marked Soon in the source dashboard. Use this space for report templates and scheduled exports.</p>
      </Card>
    </>
  );
}

