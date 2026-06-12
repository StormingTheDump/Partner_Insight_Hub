export type OrderLog = {
  orderNo: string;
  hotel: string;
  feed: string;
  priceCheck: string;
  booking: string;
  traceIds: string;
  lastEvent: string;
  priceCheckLogs: { time: string; title: string; detail: string }[];
  bookingLogs: { time: string; title: string; detail: string }[];
};

export const orderLogs: OrderLog[] = [
  {
    orderNo: "DIDA-20260610-88421",
    hotel: "Hampton Inn Binghamton/Johnson City",
    feed: "HUB_Dida_B2B",
    priceCheck: "Passed",
    booking: "Confirmed",
    traceIds: "pc_91bf4 / bk_3de21",
    lastEvent: "Jun 10, 11:09:05",
    priceCheckLogs: [
      { time: "11:08:41", title: "Valuation request sent", detail: "Rate BAR-STD validated against supplier net price." },
      { time: "11:08:47", title: "Provider returned net price", detail: "Net price stayed inside configured tolerance." },
      { time: "11:08:52", title: "Price-check passed", detail: "Booking flow released to confirmation." }
    ],
    bookingLogs: [
      { time: "11:08:54", title: "Booking request created", detail: "Guest and payment payload accepted." },
      { time: "11:09:01", title: "Supplier confirmation received", detail: "Confirmation code stored." },
      { time: "11:09:05", title: "Order completed", detail: "Order synchronized back to marketplace." }
    ]
  },
  {
    orderNo: "DIDA-20260610-88422",
    hotel: "Comfort Inn Downtown",
    feed: "HUB_Dida_B2B",
    priceCheck: "Passed",
    booking: "Pending supplier",
    traceIds: "pc_77ab2 / bk_71c09",
    lastEvent: "Jun 10, 11:12:44",
    priceCheckLogs: [
      { time: "11:12:11", title: "Valuation request sent", detail: "Room and cancellation terms checked." },
      { time: "11:12:19", title: "Price-check passed", detail: "Tolerance threshold remained below 0.7%." }
    ],
    bookingLogs: [
      { time: "11:12:31", title: "Booking request created", detail: "Supplier accepted booking request." },
      { time: "11:12:44", title: "Pending supplier", detail: "Waiting for final confirmation callback." }
    ]
  },
  {
    orderNo: "DIDA-20260610-88423",
    hotel: "Hilton Garden Inn Ames",
    feed: "HUB_Dida_CUG",
    priceCheck: "Price changed",
    booking: "Stopped",
    traceIds: "pc_30ef1 / -",
    lastEvent: "Jun 10, 11:15:18",
    priceCheckLogs: [
      { time: "11:15:02", title: "Provider returned net price", detail: "Net price moved outside configured tolerance." },
      { time: "11:15:18", title: "Booking stopped", detail: "Order stopped before supplier booking attempt." }
    ],
    bookingLogs: [{ time: "11:15:18", title: "Not attempted", detail: "Price-check failure prevented booking." }]
  },
  {
    orderNo: "DIDA-20260610-88424",
    hotel: "The Lofton Hotel",
    feed: "HUB_Dida_NonTravel_BankOnly",
    priceCheck: "Passed",
    booking: "Confirmed",
    traceIds: "pc_64aa8 / bk_5580d",
    lastEvent: "Jun 10, 11:22:39",
    priceCheckLogs: [
      { time: "11:22:12", title: "Valuation request sent", detail: "Bank-only feed applied marketplace adjustment." },
      { time: "11:22:21", title: "Price-check passed", detail: "Adjustment stayed under tolerance." }
    ],
    bookingLogs: [
      { time: "11:22:28", title: "Booking request created", detail: "Supplier reservation request accepted." },
      { time: "11:22:39", title: "Order completed", detail: "Confirmation received and stored." }
    ]
  },
  {
    orderNo: "DIDA-20260610-88425",
    hotel: "Econo Lodge Whiteville",
    feed: "HUB_Dida_B2B",
    priceCheck: "No room",
    booking: "Not attempted",
    traceIds: "pc_5f2c0 / -",
    lastEvent: "Jun 10, 11:24:02",
    priceCheckLogs: [{ time: "11:24:02", title: "No available room", detail: "Supplier returned sold-out response." }],
    bookingLogs: [{ time: "11:24:02", title: "Not attempted", detail: "Inventory failure prevented booking." }]
  }
];

