import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Download } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { BaseChart } from "@/shared/charts/BaseChart";
import { Button } from "@/shared/components/Button";
import { PageHeader } from "@/shared/components/PageHeader";
import { metricsApi, type OverviewData, type FunnelData, type DimensionsData, type PerformanceData } from "@/lib/metricsApi";
import type { EChartsOption } from "echarts";

// ── helpers ────────────────────────────────────────────────────────────────────

const fmt  = (n: number) => n.toLocaleString();
const fmtK = (n: number) => `$${(n / 1000).toFixed(0)}K`;
const fmtP = (n: number) => `${n}%`;

function rate(label: string, val: number, good = 80): ReactElement {
  const color = val >= good ? "#16a34a" : val >= good * 0.85 ? "#d97706" : "#dc2626";
  return <span style={{ color, fontWeight: 700 }}>{label} {fmtP(val)}</span>;
}

function Tag({ label, tone }: { label: string; tone: "green" | "amber" | "red" | "blue" }) {
  const bg: Record<string, string> = { green: "#dcfce7", amber: "#fef3c7", red: "#fee2e2", blue: "#dbeafe" };
  const fg: Record<string, string> = { green: "#15803d", amber: "#92400e", red: "#b91c1c", blue: "#1d4ed8" };
  return (
    <span style={{ background: bg[tone], color: fg[tone], fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" as const }}>
      {label}
    </span>
  );
}

function Divider() {
  return <hr style={{ border: "none", borderTop: "1px solid #e8edf4", margin: "28px 0" }} />;
}

function SectionTitle({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ background: "#4f5fb8", color: "#fff", fontWeight: 800, fontSize: 12, width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</span>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#17213f" }}>{title}</h2>
    </div>
  );
}

function KV({ label, value, sub }: { label: string; value: string | ReactElement; sub?: string }) {
  return (
    <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e8edf4" }}>
      <div style={{ fontSize: 11, color: "#8390ad", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#17213f", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#8390ad", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.75, color: "#334155" }}>{children}</p>;
}

function miniBarOpt(labels: string[], values: number[], colors: string[]): EChartsOption {
  return {
    grid: { left: 8, right: 8, top: 8, bottom: 20, containLabel: true },
    xAxis: { type: "category", data: labels, axisLabel: { fontSize: 11, color: "#526078" } },
    yAxis: { type: "value", show: false },
    series: [{
      type: "bar", barMaxWidth: 32,
      data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i % colors.length] } })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      label: { show: true, position: "top" as const, fontSize: 10, color: "#526078", formatter: (p: any) => p.value.toLocaleString() },
    }],
  };
}

// ── main component ────────────────────────────────────────────────────────────

export function ReportsPage(_: PageProps) {
  const [ov,  setOv]  = useState<OverviewData | null>(null);
  const [fn,  setFn]  = useState<FunnelData | null>(null);
  const [dim, setDim] = useState<DimensionsData | null>(null);
  const [pf,  setPf]  = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      metricsApi.overview(),
      metricsApi.funnel(),
      metricsApi.dimensions(),
      metricsApi.performance(),
    ]).then(([o, f, d, p]) => { setOv(o); setFn(f); setDim(d); setPf(p); })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !ov || !fn || !dim || !pf) {
    return (
      <>
        <PageHeader title="分析报告" description="Agoda 渠道业务综合分析报告。" />
        <p className="tiny" style={{ padding: 32 }}>报告生成中…</p>
      </>
    );
  }

  // ── derived insights ──────────────────────────────────────────────────────
  const { summary, daily } = ov;
  const f = fn.overall;
  const clients = fn.by_client;

  const topClient  = [...clients].sort((a, b) => b.bookings - a.bookings)[0];
  const bestAccu   = [...clients].sort((a, b) => b.accurate_rate - a.accurate_rate)[0];
  const worstAccu  = [...clients].sort((a, b) => a.accurate_rate - b.accurate_rate)[0];
  const fastClient = [...clients].sort((a, b) => a.avg_response_ms - b.avg_response_ms)[0];
  const slowClient = [...clients].sort((a, b) => b.avg_response_ms - a.avg_response_ms)[0];

  const totalConvRate   = ((f.bookings / f.searches) * 100).toFixed(1);
  const shortLtPct      = dim.lt.filter(r => r.lt_bucket === "0-3天" || r.lt_bucket === "4-7天").reduce((s, r) => s + r.pct, 0).toFixed(1);
  const highStarPct     = dim.star.filter(r => r.star_rating === "4星" || r.star_rating === "5星").reduce((s, r) => s + r.pct, 0).toFixed(1);
  const topCountry      = dim.country[0];
  const top3CountryPct  = dim.country.slice(0, 3).reduce((s, r) => s + r.pct, 0).toFixed(1);
  const chainPct        = dim.chain.find(r => r.chain_type === "连锁酒店")?.pct ?? 0;
  const avgResponseAll  = Math.round(clients.reduce((s, c) => s + c.avg_response_ms, 0) / clients.length);
  const accuGap         = (bestAccu.accurate_rate - worstAccu.accurate_rate).toFixed(1);

  // Risks
  const risks: { title: string; desc: string; tone: "red" | "amber" | "green" | "blue" }[] = [];
  if (f.accurate_rate < 82)
    risks.push({ tone: "amber", title: "准确验价率偏低", desc: `当前 ${fmtP(f.accurate_rate)}，低于行业建议值 85%，价格变动导致的转化损失约 ${fmt(f.confirms - f.accurates)} 次/月，建议加强价格缓存一致性。` });
  if (avgResponseAll > 450)
    risks.push({ tone: "amber", title: "平均响应时长偏高", desc: `全渠道均值 ${avgResponseAll}ms，${slowClient.client_id} 达 ${slowClient.avg_response_ms}ms，超过 500ms 将显著影响渠道端用户体验，建议排查超时节点。` });
  if (Number(shortLtPct) > 35)
    risks.push({ tone: "blue", title: "短提前期占比较高", desc: `0–7天预订合计 ${shortLtPct}%，实时库存可用性要求高，需确保 last-minute 查价命中率稳定。` });
  if (Number(accuGap) > 10)
    risks.push({ tone: "red", title: "渠道间准确验价率差距较大", desc: `${bestAccu.client_id}（${fmtP(bestAccu.accurate_rate)}）与 ${worstAccu.client_id}（${fmtP(worstAccu.accurate_rate)}）相差 ${accuGap}%，弱势渠道需单独复盘定价策略。` });
  if (risks.length === 0)
    risks.push({ tone: "green", title: "整体运营健康", desc: "各项核心指标均在正常区间，暂无高优先级风险项。" });

  const period = `${daily.labels[0]} 至 ${daily.labels[daily.labels.length - 1]}`;

  return (
    <>
      <PageHeader
        title="分析报告"
        description="Agoda 渠道业务综合分析报告，数据实时聚合自 6 个 Client ID。"
        actions={
          <Button onClick={() => window.print()}>
            <Download className="icon" /> 导出 PDF
          </Button>
        }
      />

      <div ref={reportRef} style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Report Header ── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e0e6f0", padding: "32px 40px 24px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" as const, gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#8390ad", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 6 }}>Dida Travel · 渠道业务分析报告</div>
              <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: "#17213f" }}>Agoda 合作渠道月度分析</h1>
              <div style={{ fontSize: 13, color: "#8390ad" }}>报告周期：{period} &nbsp;·&nbsp; 渠道：Agoda（含 6 个 Client ID）</div>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <Tag label="正式报告" tone="blue" />
              <div style={{ fontSize: 12, color: "#aab2c8", marginTop: 6 }}>数据截至 {daily.labels[daily.labels.length - 1]}</div>
            </div>
          </div>

          {/* Executive Summary */}
          <div style={{ marginTop: 24, background: "#f0f4ff", borderRadius: 8, padding: "16px 20px", borderLeft: "4px solid #4f5fb8" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4f5fb8", letterSpacing: "0.08em", marginBottom: 10 }}>执行摘要</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column" as const, gap: 6 }}>
              <li style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                报告周期内 Agoda 渠道累计完成订单 <strong>{fmt(summary.total_bookings)}</strong> 笔，总交易额 <strong>{fmtK(summary.total_ttv)}</strong>，漏斗整体转化率 <strong>{totalConvRate}%</strong>（查价→下单）。
              </li>
              <li style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                各渠道中 <strong>{topClient.client_id}</strong> 贡献订单量最高（{fmt(topClient.bookings)} 笔），<strong>{bestAccu.client_id}</strong> 准确验价率最优（{fmtP(bestAccu.accurate_rate)}）；<strong>{worstAccu.client_id}</strong> 验价准确率相对偏低（{fmtP(worstAccu.accurate_rate)}），是下阶段重点优化方向。
              </li>
              <li style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                订单结构上，{highStarPct}% 集中于 4–5 星酒店，{top3CountryPct}% 来自{dim.country.slice(0, 3).map(r => r.country).join("、")}三大目的地，{shortLtPct}% 为 0–7 天短提前期预订。
              </li>
            </ul>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e0e6f0", padding: "32px 40px" }}>

          {/* SECTION 1: 核心指标 */}
          <SectionTitle n={1} title="核心业务指标" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <KV label="总下单数" value={fmt(summary.total_bookings)} sub="近30天" />
            <KV label="总交易额（TTV）" value={fmtK(summary.total_ttv)} sub="美元" />
            <KV label="平均订单价值" value={`$${fmt(summary.avg_order_value)}`} sub="每笔" />
            <KV label="间夜数" value={fmt(summary.total_room_nights)} sub="累计" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 8 }}>
            <KV label="查价数" value={fmt(f.searches)} sub="Price Search" />
            <KV label="验价数" value={fmt(f.confirms)} sub="Price Confirm" />
            <KV label="平均响应时长" value={`${summary.avg_response_ms}ms`} sub={avgResponseAll > 450 ? "⚠ 偏高" : "正常"} />
          </div>

          <Divider />

          {/* SECTION 2: 转化漏斗 */}
          <SectionTitle n={2} title="转化漏斗分析" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
            <div>
              <P>
                本周期内渠道发起查价 <strong>{fmt(f.searches)}</strong> 次，其中有价返回 <strong>{fmt(f.results)}</strong> 次，{rate("有价率", f.result_rate, 75)}。
                进入验价环节 <strong>{fmt(f.confirms)}</strong> 次，
                价格完全一致（准确验价）<strong>{fmt(f.accurates)}</strong> 次，{rate("准确验价率", f.accurate_rate, 82)}；
                共有 <strong>{fmt(f.confirms - f.accurates)}</strong> 次存在价格变动，是下单流失的主要原因之一。
              </P>
              <P>
                最终成交订单 <strong>{fmt(f.bookings)}</strong> 笔，验价→下单转化率 {rate("", f.confirm_to_book, 30)}，
                查价到下单整体漏斗转化 <strong>{totalConvRate}%</strong>。
                {f.result_rate < 75
                  ? "有价率低于参考值，建议核查无房错误和超时比例。"
                  : "有价率表现稳健。"}
              </P>

              {/* per-client confirm_to_book table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
                <thead>
                  <tr>
                    {["Client ID", "验价数", "准确验价率", "验价→下单"].map(h => (
                      <th key={h} style={{ position: "sticky", top: 0, zIndex: 2, background: "#f8fafd", color: "#526078", fontSize: 12, fontWeight: 800, padding: "11px 13px", borderBottom: "2px solid var(--line)", whiteSpace: "nowrap", verticalAlign: "middle", textAlign: h === "Client ID" ? "left" : "right" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.client_id}>
                      <td style={{ padding: "11px 13px", color: "#17213f", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>{c.client_id}</td>
                      <td style={{ padding: "11px 13px", textAlign: "right", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>{fmt(c.confirms)}</td>
                      <td style={{ padding: "11px 13px", textAlign: "right", color: c.accurate_rate >= 85 ? "#16a34a" : c.accurate_rate >= 78 ? "#d97706" : "#dc2626", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>{fmtP(c.accurate_rate)}</td>
                      <td style={{ padding: "11px 13px", textAlign: "right", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>{fmtP(c.confirm_to_book_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mini funnel bars */}
            <div>
              <BaseChart style={{ height: 220 }} option={{
                tooltip: { trigger: "item", formatter: "{b}: {c}" },
                series: [{
                  type: "funnel" as const,
                  left: "5%", width: "90%", minSize: "20%", maxSize: "100%",
                  sort: "descending" as const, gap: 4,
                  label: { show: true, position: "inside" as const, color: "#fff", fontSize: 11, fontWeight: 600,
                    formatter: (p: { name: string; value: number }) => `${p.name} ${p.value.toLocaleString()}` },
                  itemStyle: { borderWidth: 0 },
                  data: [
                    { value: f.searches,  name: "查价",    itemStyle: { color: "#4f5fb8" } },
                    { value: f.results,   name: "有价",    itemStyle: { color: "#6b7fd4" } },
                    { value: f.confirms,  name: "验价",    itemStyle: { color: "#12b981" } },
                    { value: f.accurates, name: "准确验价", itemStyle: { color: "#34d399" } },
                    { value: f.bookings,  name: "下单",    itemStyle: { color: "#f59e0b" } },
                  ],
                }] as EChartsOption["series"],
              }} />
            </div>
          </div>

          <Divider />

          {/* SECTION 3: 渠道表现 */}
          <SectionTitle n={3} title="各 Client ID 渠道表现" />
          <P>
            Agoda 旗下 6 个 Client ID 在本周期内均有不同程度的活跃度。
            订单量最高的 <strong>{topClient.client_id}</strong>（{fmt(topClient.bookings)} 笔），占全渠道总量约 {((topClient.bookings / summary.total_bookings) * 100).toFixed(0)}%；
            响应最快的渠道为 <strong>{fastClient.client_id}</strong>（{fastClient.avg_response_ms}ms），与最慢渠道 <strong>{slowClient.client_id}</strong>（{slowClient.avg_response_ms}ms）相差 {slowClient.avg_response_ms - fastClient.avg_response_ms}ms，
            建议对高延迟渠道进行专项优化。
          </P>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                {["Client ID", "订单数", "TTV ($)", "均价 ($)", "间夜数", "准确验价率", "验价→下单", "响应时长"].map(h => (
                  <th key={h} style={{ position: "sticky", top: 0, zIndex: 2, background: "#f8fafd", color: "#526078", fontSize: 12, fontWeight: 800, padding: "11px 13px", borderBottom: "2px solid var(--line)", whiteSpace: "nowrap", verticalAlign: "middle", textAlign: h === "Client ID" ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pf.rows.map((r, i) => {
                const fc = clients.find(c => c.client_id === r.client_id);
                return (
                  <tr key={r.client_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfd" }}>
                    <td style={{ padding: "11px 13px", color: "#17213f", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>{r.client_id}</td>
                    <td style={{ padding: "11px 13px", textAlign: "right", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>{fmt(r.bookings)}</td>
                    <td style={{ padding: "11px 13px", textAlign: "right", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>{r.ttv.toLocaleString()}</td>
                    <td style={{ padding: "11px 13px", textAlign: "right", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>${fmt(r.avg_order_value)}</td>
                    <td style={{ padding: "11px 13px", textAlign: "right", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>{fmt(r.room_nights)}</td>
                    <td style={{ padding: "11px 13px", textAlign: "right", color: fc && fc.accurate_rate >= 85 ? "#16a34a" : fc && fc.accurate_rate >= 78 ? "#d97706" : "#dc2626", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      {fc ? fmtP(fc.accurate_rate) : "-"}
                    </td>
                    <td style={{ padding: "11px 13px", textAlign: "right", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>{fc ? fmtP(fc.confirm_to_book_rate) : "-"}</td>
                    <td style={{ padding: "11px 13px", textAlign: "right", color: fc && fc.avg_response_ms > 480 ? "#d97706" : "#334155", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      {fc ? `${fc.avg_response_ms}ms` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Divider />

          {/* SECTION 4: 订单结构 */}
          <SectionTitle n={4} title="订单结构分析" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#526078", marginBottom: 8 }}>提前预订天数（LT）分布</div>
              <BaseChart style={{ height: 160 }} option={miniBarOpt(
                dim.lt.map(r => r.lt_bucket),
                dim.lt.map(r => r.bookings),
                ["#ef4444","#f97316","#f59e0b","#22c55e","#3b82f6"]
              )} />
              <P>
                短提前期（0–7天）合计占比 <strong>{shortLtPct}%</strong>，8–14天为主力区间（{dim.lt.find(r => r.lt_bucket === "8-14天")?.pct ?? 0}%），
                结构较均衡。短 LT 订单均价普遍高于均值约 15–25%，对营收贡献不成比例。
              </P>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#526078", marginBottom: 8 }}>酒店星级分布（0–5星）</div>
              <BaseChart style={{ height: 160 }} option={miniBarOpt(
                dim.star.map(r => r.star_rating),
                dim.star.map(r => r.bookings),
                ["#94a3b8","#cbd5e1","#fbbf24","#f59e0b","#3b82f6","#8b5cf6"]
              )} />
              <P>
                4–5星酒店合计占比 <strong>{highStarPct}%</strong>，5星均价约为全渠道均值的 1.65 倍，
                是 TTV 的主要贡献来源。连锁酒店占比 <strong>{chainPct}%</strong>，独立酒店 {(100 - chainPct).toFixed(0)}%。
              </P>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#526078", marginBottom: 8 }}>目的地国家 Top 9</div>
            <BaseChart style={{ height: 140 }} option={miniBarOpt(
              dim.country.map(r => r.country),
              dim.country.map(r => r.bookings),
              ["#3b82f6","#12b981","#f59e0b","#ef4444","#8b5cf6","#e54897","#06b6d4","#84cc16","#94a3b8"]
            )} />
            <P>
              <strong>{topCountry.country}</strong> 为第一目的地（占比 {topCountry.pct}%），
              前三大目的地（{dim.country.slice(0, 3).map(r => r.country).join("、")}）合计 <strong>{top3CountryPct}%</strong>，
              集中度{Number(top3CountryPct) > 55 ? "较高，建议关注地区风险分散" : "合理，市场覆盖相对均衡"}。
            </P>
          </div>

          <Divider />

          {/* SECTION 5: 运营效率 */}
          <SectionTitle n={5} title="运营效率指标" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <KV label="查价平均响应" value={`${summary.avg_response_ms}ms`} sub={summary.avg_response_ms > 450 ? "⚠ 建议优化" : "✓ 正常"} />
            <KV label="预订前错误率" value={fmtP(summary.avg_pre_error_rate)} sub={summary.avg_pre_error_rate > 3 ? "⚠ 偏高" : "✓ 正常"} />
            <KV label="预订错误率" value={fmtP(summary.avg_book_error_rate)} sub={summary.avg_book_error_rate > 2 ? "⚠ 需关注" : "✓ 正常"} />
          </div>
          <P>
            {fastClient.client_id} 响应最快（{fastClient.avg_response_ms}ms），为用户端提供最佳查价体验；
            {slowClient.client_id} 响应达 {slowClient.avg_response_ms}ms，
            {slowClient.avg_response_ms > 500
              ? "已超过推荐阈值 500ms，需重点排查是否存在实时房态超时问题。"
              : "处于可接受范围，但仍有优化空间。"}
            预订前错误率 {fmtP(summary.avg_pre_error_rate)} 反映查价/验价阶段整体稳定性，
            {summary.avg_pre_error_rate > 3 ? "当前偏高，建议分渠道排查无房与超时错误来源。" : "表现正常。"}
          </P>

          <Divider />

          {/* SECTION 6: 风险与建议 */}
          <SectionTitle n={6} title="风险识别与优化建议" />
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {risks.map((r, i) => (
              <div key={i} style={{
                padding: "14px 18px", borderRadius: 8,
                background: r.tone === "green" ? "#f0fdf4" : r.tone === "amber" ? "#fffbeb" : r.tone === "red" ? "#fef2f2" : "#eff6ff",
                border: `1px solid ${r.tone === "green" ? "#bbf7d0" : r.tone === "amber" ? "#fde68a" : r.tone === "red" ? "#fecaca" : "#bfdbfe"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Tag label={r.tone === "green" ? "✓ 正常" : r.tone === "amber" ? "⚠ 关注" : r.tone === "red" ? "● 风险" : "ℹ 提示"} tone={r.tone} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "#17213f" }}>{r.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.65 }}>{r.desc}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #e8edf4", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#aab2c8" }}>
            <span>本报告由 Dida Partner Insight Hub 自动生成 · 数据周期 {period}</span>
            <span>仅供 Agoda 渠道对接方内部参考</span>
          </div>
        </div>
      </div>
    </>
  );
}
