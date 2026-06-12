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
    priceCheck: "通过",
    booking: "已确认",
    traceIds: "pc_91bf4 / bk_3de21",
    lastEvent: "6月10日 11:09:05",
    priceCheckLogs: [
      { time: "11:08:41", title: "估值请求已发送", detail: "BAR-STD价格已根据供应商净价验证。" },
      { time: "11:08:47", title: "供应商返回净价", detail: "净价在配置容差范围内。" },
      { time: "11:08:52", title: "价格检查通过", detail: "预订流程已释放至确认阶段。" }
    ],
    bookingLogs: [
      { time: "11:08:54", title: "预订请求已创建", detail: "客户及支付信息已接受。" },
      { time: "11:09:01", title: "已收到供应商确认", detail: "确认码已存储。" },
      { time: "11:09:05", title: "订单已完成", detail: "订单已同步回渠道市场。" }
    ]
  },
  {
    orderNo: "DIDA-20260610-88422",
    hotel: "Comfort Inn Downtown",
    feed: "HUB_Dida_B2B",
    priceCheck: "通过",
    booking: "等待供应商",
    traceIds: "pc_77ab2 / bk_71c09",
    lastEvent: "6月10日 11:12:44",
    priceCheckLogs: [
      { time: "11:12:11", title: "估值请求已发送", detail: "房型及取消条款已检查。" },
      { time: "11:12:19", title: "价格检查通过", detail: "容差阈值保持在0.7%以下。" }
    ],
    bookingLogs: [
      { time: "11:12:31", title: "预订请求已创建", detail: "供应商已接受预订请求。" },
      { time: "11:12:44", title: "等待供应商", detail: "等待最终确认回调。" }
    ]
  },
  {
    orderNo: "DIDA-20260610-88423",
    hotel: "Hilton Garden Inn Ames",
    feed: "HUB_Dida_CUG",
    priceCheck: "价格变动",
    booking: "已停止",
    traceIds: "pc_30ef1 / -",
    lastEvent: "6月10日 11:15:18",
    priceCheckLogs: [
      { time: "11:15:02", title: "供应商返回净价", detail: "净价超出配置容差范围。" },
      { time: "11:15:18", title: "预订已停止", detail: "在供应商预订尝试前订单已停止。" }
    ],
    bookingLogs: [{ time: "11:15:18", title: "未尝试", detail: "价格检查失败阻止了预订。" }]
  },
  {
    orderNo: "DIDA-20260610-88424",
    hotel: "The Lofton Hotel",
    feed: "HUB_Dida_NonTravel_BankOnly",
    priceCheck: "通过",
    booking: "已确认",
    traceIds: "pc_64aa8 / bk_5580d",
    lastEvent: "6月10日 11:22:39",
    priceCheckLogs: [
      { time: "11:22:12", title: "估值请求已发送", detail: "仅银行渠道应用了渠道市场调整。" },
      { time: "11:22:21", title: "价格检查通过", detail: "调整幅度在容差范围内。" }
    ],
    bookingLogs: [
      { time: "11:22:28", title: "预订请求已创建", detail: "供应商预订请求已接受。" },
      { time: "11:22:39", title: "订单已完成", detail: "确认码已收到并存储。" }
    ]
  },
  {
    orderNo: "DIDA-20260610-88425",
    hotel: "Econo Lodge Whiteville",
    feed: "HUB_Dida_B2B",
    priceCheck: "无房间",
    booking: "未尝试",
    traceIds: "pc_5f2c0 / -",
    lastEvent: "6月10日 11:24:02",
    priceCheckLogs: [{ time: "11:24:02", title: "无可用房间", detail: "供应商返回售罄响应。" }],
    bookingLogs: [{ time: "11:24:02", title: "未尝试", detail: "库存不足阻止了预订。" }]
  }
];
