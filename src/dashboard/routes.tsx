import type { ComponentType } from "react";
import type { PageId } from "@/dashboard/app-state";
import { ApiPerformancePage } from "@/features/api-performance/ApiPerformancePage";
import { BookingsPage } from "@/features/bookings/BookingsPage";
import { CostAnalysisPage } from "@/features/cost-analysis/CostAnalysisPage";
import { ErrorsPage } from "@/features/errors/ErrorsPage";
import { FinanceStatusPage } from "@/features/finance-status/FinanceStatusPage";
import { InventoryPage } from "@/features/inventory/InventoryPage";
import { MarketplaceAnalyticsPage } from "@/features/marketplace-analytics/MarketplaceAnalyticsPage";
import { MarketplaceConfigurationPage } from "@/features/marketplace-configuration/MarketplaceConfigurationPage";
import { OrderLogsPage } from "@/features/order-logs/OrderLogsPage";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { PerformancePage } from "@/features/performance/PerformancePage";
import { ReportsPage } from "@/features/reports/ReportsPage";

export type PageProps = {
  selectedFeed: string;
  showPreviousPeriod: boolean;
};

export const routes: Record<PageId, ComponentType<PageProps>> = {
  overview: OverviewPage,
  performance: PerformancePage,
  reports: ReportsPage,
  api: ApiPerformancePage,
  errors: ErrorsPage,
  inventory: InventoryPage,
  configuration: MarketplaceConfigurationPage,
  analytics: MarketplaceAnalyticsPage,
  cost: CostAnalysisPage,
  finance: FinanceStatusPage,
  "order-logs": OrderLogsPage,
  bookings: BookingsPage,
};
