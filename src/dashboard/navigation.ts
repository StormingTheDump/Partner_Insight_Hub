import {
  Activity,
  BarChart3,
  CalendarDays,
  Code2,
  FileText,
  Flame,
  GitMerge,
  Home,
  ListTree,
  MessageCircle,
  ScrollText,
  Store,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PageId } from "@/dashboard/app-state";

export type NavItem = {
  id: PageId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  badgeTone?: "active" | "soon";
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: "业务指标",
    items: [
      { id: "overview",     label: "概览",     icon: Home },
      { id: "performance",  label: "订单分析", icon: BarChart3 },
      { id: "reports",      label: "分析报告", icon: FileText },
    ],
  },
  {
    title: "运营指标",
    items: [
      { id: "api",        label: "技术指标", icon: Activity },
      { id: "errors",     label: "错误日志", icon: ScrollText },
      { id: "conversion", label: "转化指标", icon: TrendingUp },
    ],
  },
  {
    title: "渠道信息",
    items: [
      { id: "configuration",    label: "渠道配置",  icon: Store },
      { id: "channel-mapping",  label: "渠道匹配",  icon: GitMerge },
      { id: "hot-sales",        label: "渠道热销",  icon: Flame },
      { id: "finance",          label: "财务信息",  icon: WalletCards },
      { id: "order-logs",       label: "订单日志",  icon: ListTree },
      { id: "bookings",         label: "订单管理",  icon: CalendarDays },
    ],
  },
  {
    title: "支持与资源",
    items: [
      { id: "contact", label: "联系方式", icon: MessageCircle },
      { id: "dida-api", label: "Dida API", icon: Code2 },
    ],
  },
];

export const feedOptions = [
  "全部渠道",
  "Agoda",
  "AgodaEBK",
  "AgodaUK",
  "Lvzan",
  "DidaOpaq",
  "Barli2b",
];
