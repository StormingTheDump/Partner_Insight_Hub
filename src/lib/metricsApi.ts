const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

export interface OverviewData {
  summary: {
    total_bookings: number;
    total_ttv: number;
    avg_order_value: number;
    total_room_nights: number;
    win_rate: number;
    avg_pre_error_rate: number;
    avg_book_error_rate: number;
  };
  daily: {
    labels: string[];
    ttv: number[];
    bookings: number[];
    avg_order_value: number[];
    room_nights: number[];
    win_rate: number[];
    pre_error_rate: number[];
    book_error_rate: number[];
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

export const metricsApi = {
  overview: () => get<OverviewData>('/api/metrics/overview'),
  performance: () => get<PerformanceData>('/api/metrics/performance'),
};
