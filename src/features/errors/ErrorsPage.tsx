import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { horizontalLossOption } from "@/data/chart-options";
import { errorRows } from "@/data/dashboard";
import { includesText } from "@/data/formatters";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { ChartCard } from "@/shared/components/ChartCard";
import { DataTable } from "@/shared/components/DataTable";
import { SearchFilter } from "@/shared/components/FilterControl";
import { PageHeader } from "@/shared/components/PageHeader";
import type { TableColumn } from "@/shared/types/table";

const columns: TableColumn<(typeof errorRows)[number]>[] = [
  { key: "date", header: "日期" },
  { key: "source", header: "来源" },
  { key: "action", header: "操作" },
  { key: "errorType", header: "错误类型" },
  { key: "message", header: "供应商消息" },
  { key: "errors", header: "错误次数", align: "right" },
  { key: "leadTime", header: "提前期" },
  { key: "hotelId", header: "酒店ID" },
  { key: "rateCode", header: "价格代码" },
  { key: "actions", header: "操作", render: () => <Button>查看详情</Button> }
];

export function ErrorsPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => errorRows.filter((row) => includesText(Object.values(row), query)), [query]);

  return (
    <>
      <PageHeader
        title="错误日志"
        description="查看近期供应商错误及预估营收影响。"
        actions={
          <Button>
            <Download className="icon" /> 导出错误
          </Button>
        }
      />
      <Card>
        <strong>48小时日志窗口</strong>
        <p className="tiny">本系统保留最近48小时的详细供应商日志。</p>
      </Card>
      <div className="filter-row" style={{ marginTop: 18 }}>
        <button className="filter-control" type="button">操作</button>
        <button className="filter-control" type="button">错误类型</button>
        <button className="filter-control" type="button">来源</button>
        <button className="filter-control" type="button">提前期</button>
        <SearchFilter icon={<Search className="icon" />} placeholder="搜索日志" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <ChartCard title="按错误原因划分的交易额损失" subtitle="按供应商消息分组的预估损失。">
        <BaseChart className="small" option={horizontalLossOption()} />
      </ChartCard>
      <div style={{ marginTop: 22 }}>
        <DataTable columns={columns} rows={rows} getRowKey={(row) => `${row.date}-${row.hotelId}`} />
      </div>
    </>
  );
}
