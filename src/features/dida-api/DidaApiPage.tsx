import React from "react";
import { BookOpen, CheckCircle2, Code2, ExternalLink, ShieldCheck, Zap, ArrowRight, AlertCircle } from "lucide-react";

import { Card } from "@/shared/components/Card";
import { PageHeader } from "@/shared/components/PageHeader";
import { ApiChatBot } from "./ApiChatBot";

const bookingFlow = [
  { step: 1, name: "价格搜索", en: "Price Search", desc: "按入住/退房日期搜索可用房价", endpoint: "/api/hotel/HotelPriceSearch" },
  { step: 2, name: "价格确认", en: "Price Confirm", desc: "校验价格，获取预订参考号", endpoint: "/api/hotel/HotelPriceConfirm" },
  { step: 3, name: "创建预订", en: "Booking Confirm", desc: "使用参考号正式创建订单", endpoint: "/api/booking/HotelBookingConfirm" },
  { step: 4, name: "查询订单", en: "Booking Search", desc: "查询订单状态和确认码", endpoint: "/api/booking/HotelBookingSearch" },
];

const bookingStatuses = [
  { code: 0, name: "PreBook", desc: "预创建", final: false },
  { code: 1, name: "Booked", desc: "预创建 + 等待支付", final: false },
  { code: 2, name: "Confirmed", desc: "预订成功 ✦ 最终状态", final: true, success: true },
  { code: 3, name: "Canceled", desc: "已取消 ✦ 最终状态", final: true },
  { code: 4, name: "Failed", desc: "预订失败 ✦ 最终状态", final: true, danger: true },
  { code: 5, name: "Pending", desc: "过渡中（约3分钟内完成）", final: false },
  { code: 6, name: "OnRequest", desc: "按需库存（最长120分钟）", final: false },
];

const pricingErrors = [
  { code: "2000", desc: "未知错误" }, { code: "2002", desc: "未找到酒店" },
  { code: "2003", desc: "日期错误" }, { code: "2005", desc: "无可用房型" },
  { code: "2006", desc: "未找到价格方案" }, { code: "2009", desc: "可用性查询超时" },
  { code: "2017", desc: "客户端鉴权失败" }, { code: "2018", desc: "不支持的货币" },
  { code: "2022", desc: "超出QPS限制" }, { code: "2029", desc: "酒店停售" },
];

const bookingErrors = [
  { code: "3001", desc: "预订信息错误" }, { code: "3002", desc: "参考号错误" },
  { code: "3004", desc: "取消确认ID错误" }, { code: "3006", desc: "预订已过期" },
  { code: "3007", desc: "取消已过期" }, { code: "3014", desc: "信用额度不足" },
  { code: "3015", desc: "可用性或价格无效" }, { code: "3019", desc: "重复ClientReference" },
];

const goLiveSteps = [
  { n: 1, title: "签署 NDA", desc: "签署保密协议后发给客户经理" },
  { n: 2, title: "获取开发环境", desc: "收到测试账号和API文档链接" },
  { n: 3, title: "售后问卷", desc: "填写Post Sale Questionnaire" },
  { n: 4, title: "技术对接", desc: "与Dida集成团队技术沟通" },
  { n: 5, title: "测试认证", desc: "使用测试账号完成测试模板并提交Dida审核" },
  { n: 6, title: "正式凭证", desc: "通过认证后获取生产账号" },
  { n: 7, title: "上线", desc: "告知Dida团队正式上线" },
];

export function DidaApiPage() {
  return (
    <>
      <PageHeader
        title="Dida API"
        description="Dida Open API v2.0 — 酒店内容、价格搜索及预订全流程接入文档。"
        actions={
          <a href="https://apidoc.didatravel.com/" target="_blank" rel="noopener noreferrer"
            className="button">
            <ExternalLink size={14} /> DidaAPI 完整文档
          </a>
        }
      />

      {/* 基础信息 */}
      <div className="grid three-col">
        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 12 }}>
            <div className="icon-tile" style={{ background: "#eef1ff" }}>
              <Zap className="icon" style={{ color: "#4f5fb8" }} />
            </div>
            <div>
              <h3>API 版本</h3>
              <p className="tiny">当前稳定版本</p>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={rowStyle}><span className="muted">版本</span><code>v2.0</code></div>
            <div style={rowStyle}><span className="muted">测试 BaseURL</span><code style={{ fontSize: 11 }}>apiint.didatravel.com</code></div>
            <div style={rowStyle}><span className="muted">生产 BaseURL</span><code style={{ fontSize: 11 }}>api.didatravel.com</code></div>
            <div style={rowStyle}><span className="muted">更新日期</span><span>2025-08-01</span></div>
          </div>
        </Card>

        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 12 }}>
            <div className="icon-tile" style={{ background: "#f0fff4" }}>
              <ShieldCheck className="icon" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <h3>鉴权方式</h3>
              <p className="tiny">每个请求必须携带</p>
            </div>
          </div>
          <pre style={codeBlock}>{`{
  "Header": {
    "ClientID": "YourClientID",
    "LicenseKey": "YourLicenseKey"
  }
}`}</pre>
        </Card>

        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 12 }}>
            <div className="icon-tile" style={{ background: "#fff0f5" }}>
              <Code2 className="icon" style={{ color: "#ea0345" }} />
            </div>
            <div>
              <h3>技术规格</h3>
              <p className="tiny">接入基本要求</p>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={rowStyle}><span className="muted">协议</span><span>HTTP POST</span></div>
            <div style={rowStyle}><span className="muted">格式</span><span>JSON（推荐）/ XML</span></div>
            <div style={rowStyle}><span className="muted">默认 QPS</span><span>30（可申请提高）</span></div>
            <div style={rowStyle}><span className="muted">响应编码</span><span>Gzip</span></div>
            <div style={rowStyle}><span className="muted">IP 白名单</span><span>需提前提交服务器IP</span></div>
          </div>
        </Card>
      </div>

      {/* 预订流程 */}
      <div style={{ marginTop: 22 }}>
        <Card>
          <h3 style={{ marginBottom: 18 }}>预订标准流程</h3>
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {bookingFlow.map((s, i) => (
              <div key={s.step} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 160 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--dida-navy)", color: "#fff", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{s.step}</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", margin: "3px 0 6px" }}>{s.desc}</div>
                  <code style={{ fontSize: 10, background: "var(--surface-soft)", padding: "2px 6px", borderRadius: 4, display: "inline-block", wordBreak: "break-all" }}>{s.endpoint}</code>
                </div>
                {i < bookingFlow.length - 1 && (
                  <ArrowRight size={18} style={{ color: "var(--muted)", flexShrink: 0, margin: "0 4px" }} />
                )}
              </div>
            ))}
            {/* Cancel step */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <ArrowRight size={18} style={{ color: "var(--muted)", flexShrink: 0, margin: "0 4px", opacity: 0.4 }} />
              <div style={{ textAlign: "center", opacity: 0.7 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--dida-red)", color: "#fff", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>✕</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>取消订单</div>
                <div style={{ fontSize: 11, color: "var(--muted)", margin: "3px 0 6px" }}>Pre-cancel + Cancel Confirm</div>
                <code style={{ fontSize: 10, background: "var(--surface-soft)", padding: "2px 6px", borderRadius: 4 }}>/HotelBookingCancel</code>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 接口详情 + 订单状态 */}
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <Card>
          <h3 style={{ marginBottom: 14 }}>接口说明</h3>
          <div className="action-list">
            <div>
              <strong>价格搜索</strong>
              <p className="tiny" style={{ marginTop: 3 }}>支持最低价搜索、缓存价搜索、实时价搜索三种模式。默认返回2人价格。缓存以天为单位，30天缓存需调用30次。多酒店查询推荐使用缓存价搜索。</p>
            </div>
            <div>
              <strong>价格确认</strong>
              <p className="tiny" style={{ marginTop: 3 }}>校验价格有效性，返回 BookingReference（预订参考号）。该参考号是创建预订的必要参数，且返回全部房间的总价。</p>
            </div>
            <div>
              <strong>创建预订</strong>
              <p className="tiny" style={{ marginTop: 3 }}>使用价格确认返回的参考号创建预订。入住/退房日期、房间数、入住人数必须与价格确认一致。ConfirmationCode（HCN）不一定实时返回。</p>
            </div>
            <div>
              <strong>取消订单（两步）</strong>
              <p className="tiny" style={{ marginTop: 3 }}>① Pre-cancel：获取 CancelConfirmID（有效期10分钟）；② Cancel Confirm：用 CancelConfirmID 确认取消。超时需重新执行第一步。</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 14 }}>订单状态码</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {bookingStatuses.map((s) => (
              <div key={s.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 6, background: s.success ? "#f0fff4" : s.danger ? "#fff5f5" : s.final ? "#fffbeb" : "var(--surface-soft)", border: `1px solid ${s.success ? "#bbf7d0" : s.danger ? "#ffc5c5" : s.final ? "#fde68a" : "var(--line)"}` }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: s.success ? "#16a34a" : s.danger ? "#dc2626" : "var(--muted)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.code}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted-strong)" }}>{s.desc}</div>
                </div>
                {s.final && <CheckCircle2 size={14} style={{ marginLeft: "auto", color: s.success ? "#16a34a" : s.danger ? "#dc2626" : "#d97706", flexShrink: 0 }} />}
              </div>
            ))}
          </div>
          <p className="tiny" style={{ marginTop: 10, color: "#d97706" }}>
            <AlertCircle size={12} style={{ display: "inline", marginRight: 4 }} />
            仅 Status 2 / 3 / 4 为最终状态，其余不可作为最终判断依据。
          </p>
        </Card>
      </div>

      {/* 错误码 */}
      <div className="grid two-col" style={{ marginTop: 22 }}>
        <Card>
          <h3 style={{ marginBottom: 12 }}>价格搜索错误码（2xxx）</h3>
          <div className="table-wrap">
          <table style={tableStyle}>
            <thead><tr><th style={TH}>错误码</th><th style={TH}>说明</th></tr></thead>
            <tbody>
              {pricingErrors.map((e) => (
                <tr key={e.code}>
                  <td style={{ ...TD, fontFamily: "var(--font-mono)", fontSize: 12 }}><code>{e.code}</code></td>
                  <td style={TD}>{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 12 }}>预订错误码（3xxx）</h3>
          <div className="table-wrap">
          <table style={tableStyle}>
            <thead><tr><th style={TH}>错误码</th><th style={TH}>说明</th></tr></thead>
            <tbody>
              {bookingErrors.map((e) => (
                <tr key={e.code}>
                  <td style={{ ...TD, fontFamily: "var(--font-mono)", fontSize: 12 }}><code>{e.code}</code></td>
                  <td style={TD}>{e.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="tiny" style={{ marginTop: 10 }}>
            完整错误码列表见：<a href="https://apidoc.didatravel.com/information-hub/api-error-code.html" target="_blank" rel="noopener noreferrer" style={{ color: "var(--dida-navy)" }}>API Error Code</a>
          </p>
        </Card>
      </div>

      {/* 上线流程 */}
      <div style={{ marginTop: 22 }}>
        <Card>
          <div className="card-header">
            <div>
              <h3>上线流程</h3>
              <p className="tiny">从签约到正式对接的7个步骤</p>
            </div>
            <a href="https://apidoc.didatravel.com/getting-started/go-live-process.html" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--dida-navy)", fontWeight: 600, textDecoration: "none" }}>
              <BookOpen size={13} /> 查看完整说明
            </a>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {goLiveSteps.map((s) => (
              <div key={s.n} style={{ flex: "1 1 200px", background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--dida-navy)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
                  <strong style={{ fontSize: 13 }}>{s.title}</strong>
                </div>
                <p className="tiny">{s.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Chat bot */}
      <ApiChatBot />
    </>
  );
}

const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--line-soft)", fontSize: 12 };
const codeBlock: React.CSSProperties = { background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 6, padding: "10px 12px", fontSize: 11, marginTop: 10, lineHeight: 1.7, overflow: "auto" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const TH: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 2,
  background: "#f8fafd", color: "#526078",
  fontSize: 12, fontWeight: 800,
  padding: "11px 13px",
  borderBottom: "2px solid var(--line)",
  whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left",
};
const TD: React.CSSProperties = {
  padding: "11px 13px",
  borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle",
  textAlign: "left",
  whiteSpace: "nowrap",
};
