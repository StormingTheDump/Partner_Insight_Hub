import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type PageId =
  | "overview"
  | "performance"
  | "reports"
  | "api"
  | "errors"
  | "conversion"
  | "configuration"
  | "channel-mapping"
  | "hot-sales"
  | "finance"
  | "order-logs"
  | "bookings"
  | "contact"
  | "dida-api"
  | "hot-hotels"
  | "direct-hotels"
  | "cost-analysis"
  | "inventory"
  | "marketplace-analytics";

type AppState = {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  selectedFeed: string;
  setSelectedFeed: (feed: string) => void;
  showPreviousPeriod: boolean;
  setShowPreviousPeriod: (value: boolean) => void;
  dateRange: [string, string] | null;
  setDateRange: (range: [string, string] | null) => void;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState("全部渠道");
  const [showPreviousPeriod, setShowPreviousPeriod] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return [fmt(start), fmt(end)];
  });

  const value = useMemo<AppState>(
    () => ({
      activePage,
      setActivePage,
      collapsed,
      setCollapsed,
      selectedFeed,
      setSelectedFeed,
      showPreviousPeriod,
      setShowPreviousPeriod,
      dateRange,
      setDateRange,
    }),
    [activePage, collapsed, selectedFeed, showPreviousPeriod, dateRange]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
