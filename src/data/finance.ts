export const financeSummary = [
  { title: "Credit Limit", value: "$2,500,000", tone: "default" },
  { title: "Available Credit", value: "$1,040,420", tone: "green" },
  { title: "Used Credit", value: "$1,459,580", tone: "orange" },
  { title: "Credit Expiry", value: "Jul 31, 2026", tone: "red" }
];

export const settlementCalendar = [
  { date: "Jun 14", label: "Statement closes", tone: "info" },
  { date: "Jun 18", label: "Invoice generated", tone: "neutral" },
  { date: "Jun 25", label: "Payment due", tone: "warning" },
  { date: "Jul 31", label: "Credit renewal", tone: "danger" }
];

export const bills = [
  { id: "BILL-202606-A", period: "May 11 - May 31", dueDate: "Jun 25, 2026", type: "Marketplace", bookings: 3184, amount: "$612,420", status: "Due soon", aging: "11 days", owner: "Finance Ops" },
  { id: "BILL-202606-B", period: "Jun 1 - Jun 10", dueDate: "Jul 5, 2026", type: "Settlement", bookings: 2188, amount: "$418,900", status: "Open", aging: "21 days", owner: "Partner Success" },
  { id: "BILL-202605-C", period: "May adjustment", dueDate: "Jun 12, 2026", type: "Adjustment", bookings: 184, amount: "$42,760", status: "At risk", aging: "3 days", owner: "Credit Control" }
];

