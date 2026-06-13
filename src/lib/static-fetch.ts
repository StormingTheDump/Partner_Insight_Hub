/**
 * 静态模式 fetch 拦截器
 * 当 VITE_STATIC_MODE=true 时，将 /api/* 请求路由到本地 JSON 数据
 * 本地开发时不生效，继续走后端 API
 */

import usersData from "@/data/static/users.json";
import contactsDida from "@/data/static/contacts_dida.json";
import contactsMy from "@/data/static/contacts_my.json";
import channelMappings from "@/data/static/channel_mappings.json";
import hotSales from "@/data/static/hot_sales.json";
import hotSalesStats from "@/data/static/hot_sales_stats.json";
import channelConfig from "@/data/static/channel_config.json";
import orderLogs from "@/data/static/order_logs.json";
import orderLogDetails from "@/data/static/order_log_details.json";
import ordersData from "@/data/static/orders.json";
import financeSummary from "@/data/static/finance_summary.json";
import financeBills from "@/data/static/finance_bills.json";
import metricsOverview from "@/data/static/metrics_overview.json";
import metricsFunnel from "@/data/static/metrics_funnel.json";
import metricsDimensions from "@/data/static/metrics_dimensions.json";
import metricsPerformance from "@/data/static/metrics_performance.json";
import apiMetrics from "@/data/static/api_metrics.json";
import conversionMetrics from "@/data/static/conversion_metrics.json";
import errorsPrebook from "@/data/static/errors_prebook.json";
import errorsBook from "@/data/static/errors_book.json";
import errorsMeta from "@/data/static/errors_meta.json";

type AnyData = Record<string, unknown> | unknown[];

function ok(data: AnyData, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function err(status: number, detail: string): Response {
  return new Response(JSON.stringify({ detail }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function params(url: URL): Record<string, string> {
  const out: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { out[k] = v; });
  return out;
}

// ── 路由处理 ──────────────────────────────────────────────────────────────

function handleLogin(body: { email: string; password: string }): Response {
  const user = (usersData as Array<{
    id: number; email: string; password: string; channelName: string;
    contactName: string; status: string; role: string;
  }>).find(u => u.email === body.email);

  if (!user) return err(404, "账号不存在，请检查邮箱地址");
  if (user.status === "disabled") return err(403, "该账号已被禁用，请联系客户经理");
  if (user.password !== body.password) return err(401, "密码错误，请重新输入");

  const { password: _, ...safeUser } = user;
  return ok({
    success: true,
    token: "static-demo-token",
    user: { ...safeUser, channelName: safeUser.channelName, contactName: safeUser.contactName },
  });
}

function handleFinanceSummary(p: Record<string, string>): Response {
  const { credits, progress } = financeSummary as {
    credits: Array<Record<string, unknown>>;
    progress: Array<Record<string, unknown>>;
  };
  const cid = (p["client_id"] && p["client_id"] !== "all") ? p["client_id"] : null;
  const cr = cid ? credits.filter(c => c["client_id"] === cid) : credits;
  const pr = cid ? progress.filter(c => c["client_id"] === cid) : progress;

  // aggregate when "all"
  const total_credit    = (cr as Array<Record<string, number>>).reduce((s, r) => s + (r["total_credit"] ?? 0), 0);
  const avail_credit    = (cr as Array<Record<string, number>>).reduce((s, r) => s + (r["avail_credit"] ?? 0), 0);
  const consumed_credit = (cr as Array<Record<string, number>>).reduce((s, r) => s + (r["consumed_credit"] ?? 0), 0);
  const due_date        = (cr[0] ?? {})["due_date"] ?? "";
  const total_bill_amount = (pr as Array<Record<string, number>>).reduce((s, r) => s + (r["total_bill_amount"] ?? 0), 0);
  const settled_amount    = (pr as Array<Record<string, number>>).reduce((s, r) => s + (r["settled_amount"] ?? 0), 0);
  const pending_amount    = (pr as Array<Record<string, number>>).reduce((s, r) => s + (r["pending_amount"] ?? 0), 0);

  return ok({
    credit: { total_credit, avail_credit, consumed_credit, due_date },
    payment_progress: { total_bill_amount, settled_amount, pending_amount },
  });
}

function handleFinanceBills(p: Record<string, string>): Response {
  let data = [...(financeBills as Array<Record<string, unknown>>)];
  if (p["client_id"] && p["client_id"] !== "all") {
    data = data.filter(b => b["client_id"] === p["client_id"]);
  }
  return ok({ data });
}

function handleOrders(p: Record<string, string>): Response {
  let data = [...(ordersData as Array<Record<string, unknown>>)];
  if (p["client_id"] && p["client_id"] !== "全部渠道") {
    data = data.filter(o => o["client_id"] === p["client_id"]);
  }
  if (p["status"]) {
    data = data.filter(o => String(o["channel_status"]).toLowerCase() === p["status"].toLowerCase());
  }
  // support both "refs" (batch order numbers) and "q" (general keyword)
  if (p["refs"]) {
    const refList = p["refs"].split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    data = data.filter(o =>
      refList.some(r =>
        String(o["client_ref"] ?? "").toLowerCase().includes(r) ||
        String(o["dida_ref"] ?? "").toLowerCase().includes(r)
      )
    );
  } else if (p["q"]) {
    const q2 = p["q"].toLowerCase();
    data = data.filter(o =>
      String(o["client_ref"] ?? "").toLowerCase().includes(q2) ||
      String(o["dida_hotel_name"] ?? "").toLowerCase().includes(q2) ||
      String(o["dida_hotel_id"] ?? "").toLowerCase().includes(q2)
    );
  }
  // default: cap unfiltered results to 100 for performance; search returns all matches
  const isFiltered = p["refs"] || p["q"] || p["client_id"] || p["status"];
  const pool = isFiltered ? data : data.slice(0, 100);
  const total = pool.length;
  const pageSize = parseInt(p["page_size"] ?? "20");
  const page = parseInt(p["page"] ?? "1");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = pool.slice((page - 1) * pageSize, page * pageSize);
  return ok({ data: paged, pagination: { page, pageSize, total, totalPages } });
}

function handleOrderLogs(p: Record<string, string>): Response {
  let data = [...(orderLogs as Array<Record<string, unknown>>)];
  if (p["order_no"]) {
    data = data.filter(r => String(r["order_no"]).includes(p["order_no"]));
  }
  if (p["order_status"]) {
    data = data.filter(r => r["order_status"] === p["order_status"]);
  }
  return ok(data);
}

function handleChannelMapping(p: Record<string, string>): Response {
  let data = [...(channelMappings as Array<Record<string, unknown>>)];
  if (p["dida_hotel_id"]) data = data.filter(r => String(r["dida_hotel_id"]).includes(p["dida_hotel_id"]));
  if (p["client_id"])     data = data.filter(r => r["client_id"] === p["client_id"]);
  if (p["client_hotel_id"]) data = data.filter(r => String(r["client_hotel_id"]).includes(p["client_hotel_id"]));
  return ok(data);
}

function handleHotSales(p: Record<string, string>): Response {
  let data = [...(hotSales as Array<Record<string, unknown>>)];
  if (p["channel_id"]) data = data.filter(r => r["channel_id"] === p["channel_id"]);
  if (p["hotel_id"])   data = data.filter(r => String(r["hotel_id"]).includes(p["hotel_id"]));
  if (p["country"])    data = data.filter(r => r["country"] === p["country"]);
  if (p["city"])       data = data.filter(r => String(r["city"]).includes(p["city"]));
  return ok(data);
}

function handlePrebookErrors(p: Record<string, string>): Response {
  const src = errorsPrebook as {
    chart: unknown[]; total: number; page: number; page_size: number;
    rows: unknown[]; _all_rows: Array<Record<string, unknown>>;
  };
  let data = [...src._all_rows];
  if (p["client_id"])    data = data.filter(r => r["client_id"] === p["client_id"]);
  if (p["error_type"])   data = data.filter(r => r["error_type"] === p["error_type"]);
  if (p["rate_plan_id"]) data = data.filter(r => String(r["dida_rate_plan_id"]).includes(p["rate_plan_id"]));

  const chart: Record<string, number> = {};
  data.forEach(r => { const et = String(r["error_type"]); chart[et] = (chart[et] ?? 0) + 1; });
  const page = parseInt(p["page"] ?? "1");
  const page_size = parseInt(p["page_size"] ?? "15");
  return ok({
    chart: Object.entries(chart).sort((a,b) => b[1]-a[1]).map(([error_type,count]) => ({error_type,count})),
    total: data.length, page, page_size,
    rows: data.slice((page-1)*page_size, page*page_size),
  });
}

function handleBookErrors(p: Record<string, string>): Response {
  const src = errorsBook as {
    chart: unknown[]; total: number; page: number; page_size: number;
    rows: unknown[]; _all_rows: Array<Record<string, unknown>>;
  };
  let data = [...src._all_rows];
  if (p["client_id"])      data = data.filter(r => r["client_id"] === p["client_id"]);
  if (p["error_type"])     data = data.filter(r => r["error_type"] === p["error_type"]);
  if (p["booking_number"]) data = data.filter(r => String(r["channel_bookingnumber"]).includes(p["booking_number"]));

  const chart: Record<string, number> = {};
  data.forEach(r => { const et = String(r["error_type"]); chart[et] = (chart[et] ?? 0) + 1; });
  const page = parseInt(p["page"] ?? "1");
  const page_size = parseInt(p["page_size"] ?? "15");
  return ok({
    chart: Object.entries(chart).sort((a,b) => b[1]-a[1]).map(([error_type,count]) => ({error_type,count})),
    total: data.length, page, page_size,
    rows: data.slice((page-1)*page_size, page*page_size),
  });
}

// ── 主分发逻辑 ──────────────────────────────────────────────────────────────

function dispatch(url: URL, method: string, body?: Record<string, unknown>): Response | null {
  const path = url.pathname;
  const p = params(url);

  // POST
  if (method === "POST") {
    if (path.includes("/api/auth/login"))
      return handleLogin(body as { email: string; password: string });
    if (path.includes("/api/chat/dida-api"))
      return new Response("AI 助手在线上演示模式下不可用，请在本地环境启动后端服务使用。", {
        status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    if (path.includes("/api/channel-mapping/upload") || path.includes("/api/hot-sales/upload"))
      return ok({ added: 0, conflicts: [], skipped: 0, message: "演示模式：上传功能需连接后端" });
    if (path.includes("/api/contacts/my"))
      return ok({ id: Date.now(), ...body });
    if (path.includes("/api/admin/users"))
      return ok({ success: true, user: {} });
  }

  // PUT / PATCH / DELETE
  if (["PUT","PATCH","DELETE"].includes(method)) {
    if (path.includes("/api/contacts/my"))   return ok({ id: 0, ...body });
    if (path.includes("/api/admin/users"))   return ok({ success: true, status: "active" });
    return new Response(null, { status: 204 });
  }

  // GET
  if (path.includes("/api/metrics/overview"))      return ok(metricsOverview as AnyData);
  if (path.includes("/api/metrics/funnel"))        return ok(metricsFunnel as AnyData);
  if (path.includes("/api/metrics/dimensions"))    return ok(metricsDimensions as AnyData);
  if (path.includes("/api/metrics/performance"))   return ok(metricsPerformance as AnyData);
  if (path.includes("/api/integration/api-metrics")) return ok(apiMetrics as AnyData);
  if (path.includes("/api/conversion/metrics"))   return ok(conversionMetrics as AnyData);
  if (path.includes("/api/errors/meta"))          return ok(errorsMeta as AnyData);
  if (path.includes("/api/errors/prebook"))       return handlePrebookErrors(p);
  if (path.includes("/api/errors/book"))          return handleBookErrors(p);
  if (path.includes("/api/contacts/dida"))        return ok(contactsDida as AnyData);
  if (path.includes("/api/contacts/my"))          return ok(contactsMy as AnyData);
  if (path.includes("/api/channel-config"))       return ok(channelConfig as AnyData);
  if (path.includes("/api/channel-mapping"))      return handleChannelMapping(p);
  if (path.includes("/api/hot-sales/stats"))      return ok(hotSalesStats as AnyData);
  if (path.includes("/api/hot-sales"))            return handleHotSales(p);
  if (path.includes("/api/finance/summary"))      return handleFinanceSummary(p);
  if (path.includes("/api/finance/unsettled-bills")) return handleFinanceBills(p);
  if (path.includes("/api/orders"))               return handleOrders(p);

  // order-logs detail: /api/order-logs/{order_no}/detail
  const detailMatch = path.match(/\/api\/order-logs\/(.+)\/detail/);
  if (detailMatch) {
    const orderNo = decodeURIComponent(detailMatch[1]);
    const detail = (orderLogDetails as Record<string, unknown[]>)[orderNo];
    if (!detail) return err(404, "订单不存在");
    return ok(detail as AnyData);
  }
  if (path.includes("/api/order-logs"))           return handleOrderLogs(p);
  if (path.includes("/api/admin/users"))          return ok([]);

  return null;
}

// ── 安装拦截器 ────────────────────────────────────────────────────────────

export function installStaticFetch(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = typeof input === "string" ? input
      : input instanceof URL ? input.href
      : (input as Request).url;

    if (!rawUrl.includes("/api/")) return originalFetch(input, init);

    const url = new URL(rawUrl, window.location.origin);
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();

    let body: Record<string, unknown> | undefined;
    if (init?.body) {
      try { body = JSON.parse(init.body as string); } catch { /* ignore */ }
    }

    try {
      const res = dispatch(url, method, body);
      if (res) return res;
    } catch (e) {
      console.warn("[static-fetch] dispatch error:", e);
    }

    return originalFetch(input, init);
  };

  console.log("[静态模式] fetch 拦截器已启动，API 请求将使用本地 JSON 数据");
}
