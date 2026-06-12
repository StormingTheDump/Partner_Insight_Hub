const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

export interface OverviewData {
  summary: {
    total_bookings: number;
    total_ttv: number;
    avg_order_value: number;
    total_room_nights: number;
    avg_pre_error_rate: number;
    avg_book_error_rate: number;
    avg_response_ms: number;
  };
  daily: {
    labels: string[];
    ttv: number[];
    bookings: number[];
    avg_order_value: number[];
    room_nights: number[];
    pre_error_rate: number[];
    book_error_rate: number[];
    avg_response_ms: number[];
  };
}

export interface PerformanceRow {
  client_id: string;
  wins: number;
  opportunities: number;
  win_rate: string;
  bookings: number;
  ttv: number;
  avg_order_value: number;
  room_nights: number;
}

export interface PerformanceData {
  rows: PerformanceRow[];
  stacked: {
    labels: string[];
    series: Record<string, number[]>;
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export interface FunnelClientRow {
  client_id: string;
  searches: number;
  results: number;
  confirms: number;
  accurates: number;
  bookings: number;
  result_rate: number;
  search_to_confirm_rate: number;
  accurate_rate: number;
  confirm_to_book_rate: number;
  avg_response_ms: number;
}

export interface FunnelData {
  overall: {
    searches: number;
    results: number;
    confirms: number;
    accurates: number;
    bookings: number;
    result_rate: number;
    search_to_confirm: number;
    accurate_rate: number;
    confirm_to_book: number;
    avg_response_ms: number;
  };
  by_client: FunnelClientRow[];
}

export interface DimensionRow {
  bookings: number;
  ttv: number;
  room_nights: number;
  pct: number;
}
export interface DimensionsData {
  lt:      (DimensionRow & { lt_bucket: string })[];
  chain:   (DimensionRow & { chain_type: string })[];
  country: (DimensionRow & { country: string })[];
  star:    (DimensionRow & { star_rating: string })[];
}

export const metricsApi = {
  overview:    (clientId?: string) => {
    const qs = clientId ? `?client_id=${encodeURIComponent(clientId)}` : '';
    return get<OverviewData>(`/api/metrics/overview${qs}`);
  },
  performance: () => get<PerformanceData>('/api/metrics/performance'),
  dimensions:  (clientId?: string) => {
    const qs = clientId ? `?client_id=${encodeURIComponent(clientId)}` : '';
    return get<DimensionsData>(`/api/metrics/dimensions${qs}`);
  },
  funnel:      () => get<FunnelData>('/api/metrics/funnel'),
};
