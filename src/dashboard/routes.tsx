import type { ComponentType } from "react";
import type { PageId } from "@/dashboard/app-state";
import { ApiPerformancePage } from "@/features/api-performance/ApiPerformancePage";
import { BookingsPage } from "@/features/bookings/BookingsPage";
import { ChannelMappingPage } from "@/features/channel-mapping/ChannelMappingPage";
import { HotSalesPage } from "@/features/hot-sales/HotSalesPage";
import { ContactPage } from "@/features/contact/ContactPage";
import { ConversionPage } from "@/features/conversion/ConversionPage";
import { DidaApiPage } from "@/features/dida-api/DidaApiPage";
import { ErrorsPage } from "@/features/errors/ErrorsPage";
import { FinanceStatusPage } from "@/features/finance-status/FinanceStatusPage";
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
  conversion: ConversionPage,
  configuration: MarketplaceConfigurationPage,
  "channel-mapping": ChannelMappingPage,
  "hot-sales": HotSalesPage,
  finance: FinanceStatusPage,
  "order-logs": OrderLogsPage,
  bookings: BookingsPage,
  contact: ContactPage,
  "dida-api": DidaApiPage,
};
