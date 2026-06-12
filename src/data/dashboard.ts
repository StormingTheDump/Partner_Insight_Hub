import { feeds } from "@/data/chart-series";

export const overviewMetrics = [
  { title: "Win Rate", value: "2.70%", key: "win" },
  { title: "Total Bookings", value: "10,599", key: "bookings" },
  { title: "Avg Booking Value", value: "$333", key: "avg" },
  { title: "Room Nights", value: "21,907", key: "rooms" },
  { title: "Pre-Book Error Rate", value: "7.36%", key: "preError" },
  { title: "Booking Error Rate", value: "5.71%", key: "bookError" }
];

export const performanceRows = feeds.slice(0, 5).map((feed, index) => ({
  feed: feed.name,
  wins: [3001, 2653, 2163, 1874, 908][index],
  opportunities: [85765, 98486, 96712, 60310, 33792][index],
  winRate: ["3.5%", "2.7%", "2.2%", "3.1%", "2.6%"][index],
  status: index === 1 ? "Active" : "Enabled"
}));

export const errorRows = [
  { date: "Jun 10, 11:24", source: "HUB_Dida_B2B", action: "Pre-book", errorType: "No availability", message: "No available room.", errors: 842, leadTime: "0-1 days", hotelId: "44099", rateCode: "BAR-STD" },
  { date: "Jun 10, 11:18", source: "HUB_Dida_CUG", action: "Book", errorType: "Price changed", message: "Provider returned net price mismatch.", errors: 384, leadTime: "2-7 days", hotelId: "87149", rateCode: "CUG-NR" },
  { date: "Jun 10, 10:51", source: "HUB_Dida_Snap feeds", action: "Pre-book", errorType: "Timeout", message: "Supplier timed out after valuation.", errors: 126, leadTime: "8-30 days", hotelId: "621824", rateCode: "SNAP" },
  { date: "Jun 9, 18:34", source: "HUB_Dida_NonTravel_BankOnly", action: "Book", errorType: "Pending", message: "Supplier confirmation pending.", errors: 91, leadTime: "31+ days", hotelId: "48454", rateCode: "BANK" }
];

export const inventoryDownloads = [
  "Download Mapped Hotels",
  "Download Available Hotels",
  "Download Sold Hotels"
];

export const marketplaceSegments = [
  { segment: "Non-refundable", tolerance: "0.62%", impact: "$142K", status: "Active" },
  { segment: "Refundable", tolerance: "0.60%", impact: "$88K", status: "Active" },
  { segment: "0-1 days lead time", tolerance: "0.75%", impact: "$64K", status: "Watch" },
  { segment: "31+ days lead time", tolerance: "0.71%", impact: "$51K", status: "Active" }
];

