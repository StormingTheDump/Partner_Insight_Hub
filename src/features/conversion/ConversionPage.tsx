import type { PageProps } from "@/dashboard/routes";
import { PageHeader } from "@/shared/components/PageHeader";

export function ConversionPage(_: PageProps) {
  return (
    <PageHeader
      title="转化指标"
      description="查价、验价、下单各环节转化率分析，即将上线。"
    />
  );
}
