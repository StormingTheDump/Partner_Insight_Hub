import { feeds } from "@/data/chart-series";

export const overviewMetrics = [
  { title: "胜出率",       value: "3.12%",   key: "win" },
  { title: "总订单量",     value: "10,599",  key: "bookings" },
  { title: "平均订单价值", value: "$333",    key: "avg" },
  { title: "间夜数",       value: "21,907",  key: "rooms" },
  { title: "预订前错误率", value: "7.36%",   key: "preError" },
  { title: "预订错误率",   value: "5.71%",   key: "bookError" },
];

const performanceData = [
  { wins: 4120, opportunities: 118650, winRate: "3.47%", status: "活跃" },
  { wins: 2853, opportunities: 95210,  winRate: "3.00%", status: "活跃" },
  { wins: 1640, opportunities: 78430,  winRate: "2.09%", status: "已启用" },
  { wins: 980,  opportunities: 42100,  winRate: "2.33%", status: "已启用" },
  { wins: 620,  opportunities: 28760,  winRate: "2.16%", status: "已启用" },
  { wins: 386,  opportunities: 19200,  winRate: "2.01%", status: "观察中" },
];

export const performanceRows = feeds.map((feed, i) => ({
  feed: feed.name,
  wins: performanceData[i].wins,
  opportunities: performanceData[i].opportunities,
  winRate: performanceData[i].winRate,
  status: performanceData[i].status,
}));

export const errorRows = [
  { date: "6月10日 11:24", source: "HUB_Dida_B2B", action: "预订前", errorType: "无可用房", message: "无可用房间。", errors: 842, leadTime: "0-1天", hotelId: "44099", rateCode: "BAR-STD" },
  { date: "6月10日 11:18", source: "HUB_Dida_CUG", action: "预订", errorType: "价格变动", message: "供应商返回净价不匹配。", errors: 384, leadTime: "2-7天", hotelId: "87149", rateCode: "CUG-NR" },
  { date: "6月10日 10:51", source: "HUB_Dida_Snap feeds", action: "预订前", errorType: "超时", message: "定价后供应商超时。", errors: 126, leadTime: "8-30天", hotelId: "621824", rateCode: "SNAP" },
  { date: "6月9日 18:34", source: "HUB_Dida_NonTravel_BankOnly", action: "预订", errorType: "待处理", message: "等待供应商确认。", errors: 91, leadTime: "31天以上", hotelId: "48454", rateCode: "BANK" }
];

export const inventoryDownloads = [
  "下载已映射酒店",
  "下载可用酒店",
  "下载已售出酒店"
];

export const marketplaceSegments = [
  { segment: "不可退款", tolerance: "0.62%", impact: "$142K", status: "已激活" },
  { segment: "可退款", tolerance: "0.60%", impact: "$88K", status: "已激活" },
  { segment: "提前0-1天", tolerance: "0.75%", impact: "$64K", status: "观察中" },
  { segment: "提前31天以上", tolerance: "0.71%", impact: "$51K", status: "已激活" }
];
