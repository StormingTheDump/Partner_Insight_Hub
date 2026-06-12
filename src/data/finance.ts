export const financeSummary = [
  { title: "信用额度", value: "$2,500,000", tone: "default" },
  { title: "可用信用", value: "$1,040,420", tone: "green" },
  { title: "已用信用", value: "$1,459,580", tone: "orange" },
  { title: "信用到期", value: "2026年7月31日", tone: "red" }
];

export const settlementCalendar = [
  { date: "6月14日", label: "账单截止", tone: "info" },
  { date: "6月18日", label: "发票生成", tone: "neutral" },
  { date: "6月25日", label: "付款截止", tone: "warning" },
  { date: "7月31日", label: "信用续期", tone: "danger" }
];

export const bills = [
  { id: "BILL-202606-A", period: "5月11日 - 5月31日", dueDate: "2026年6月25日", type: "渠道市场", bookings: 3184, amount: "$612,420", status: "即将到期", aging: "11天", owner: "财务运营" },
  { id: "BILL-202606-B", period: "6月1日 - 6月10日", dueDate: "2026年7月5日", type: "结算", bookings: 2188, amount: "$418,900", status: "待处理", aging: "21天", owner: "合作伙伴成功" },
  { id: "BILL-202605-C", period: "5月调整", dueDate: "2026年6月12日", type: "调整", bookings: 184, amount: "$42,760", status: "高风险", aging: "3天", owner: "信用管控" }
];
