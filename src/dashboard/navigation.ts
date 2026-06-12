import {
  Activity,
  BarChart3,
  CalendarDays,
  Code2,
  FileText,
  Home,
  ListTree,
  MessageCircle,
  Percent,
  ScrollText,
  SquareCheckBig,
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
      { id: "overview",     label: "概览",       icon: Home },
      { id: "performance",  label: "业绩表现",   icon: BarChart3 },
      { id: "reports",      label: "自定义报表", icon: FileText, badge: "即将上线", badgeTone: "soon" },
    ],
  },
  {
    title: "系统集成",
    items: [
      { id: "api",       label: "API 性能",  icon: Activity },
      { id: "errors",    label: "错误日志",  icon: ScrollText },
      { id: "inventory", label: "库存",      icon: SquareCheckBig },
    ],
  },
  {
    title: "渠道市场",
    items: [
      { id: "configuration", label: "渠道配置", icon: Store,       badge: "已激活", badgeTone: "active" },
      { id: "analytics",     label: "数据分析", icon: TrendingUp },
      { id: "cost",          label: "成本分析", icon: Percent },
      { id: "finance",       label: "财务信息", icon: WalletCards },
      { id: "order-logs",    label: "订单日志", icon: ListTree },
      { id: "bookings",      label: "订单管理", icon: CalendarDays },
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
