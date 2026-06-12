import { BookOpen, Code2, ExternalLink, Zap } from "lucide-react";
import { Card } from "@/shared/components/Card";
import { PageHeader } from "@/shared/components/PageHeader";

const endpoints = [
  { method: "POST", path: "/api/v3/search", desc: "搜索可用房型及价格" },
  { method: "POST", path: "/api/v3/prebook", desc: "预订前价格校验" },
  { method: "POST", path: "/api/v3/book", desc: "创建预订订单" },
  { method: "GET",  path: "/api/v3/booking/{id}", desc: "查询订单详情" },
  { method: "POST", path: "/api/v3/cancel", desc: "取消订单" },
];

const methodColor: Record<string, string> = {
  GET: "#16a34a",
  POST: "#2563eb",
  DELETE: "#dc2626",
};

export function DidaApiPage() {
  return (
    <>
      <PageHeader title="Dida API" description="Dida 供应商 API 接入文档与快速参考。" />
      <div className="grid three-col">
        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 14 }}>
            <div className="icon-tile" style={{ background: "#eef1ff" }}>
              <Zap className="icon" style={{ color: "#4f5fb8" }} />
            </div>
            <div>
              <h3>API 版本</h3>
              <p className="tiny">当前稳定版本</p>
            </div>
          </div>
          <div className="metric-value" style={{ marginTop: 8 }}>v3.2</div>
          <p className="tiny">Base URL: <code>https://api.dida.travel</code></p>
        </Card>
        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 14 }}>
            <div className="icon-tile" style={{ background: "#f0fff4" }}>
              <Code2 className="icon" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <h3>认证方式</h3>
              <p className="tiny">请求鉴权</p>
            </div>
          </div>
          <div className="action-list" style={{ marginTop: 8 }}>
            <div>Header: <code>X-API-Key: &lt;your_key&gt;</code></div>
            <div>格式：JSON</div>
            <div>超时建议：30s</div>
          </div>
        </Card>
        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 14 }}>
            <div className="icon-tile" style={{ background: "#fff0f5" }}>
              <BookOpen className="icon" style={{ color: "#ea0345" }} />
            </div>
            <div>
              <h3>完整文档</h3>
              <p className="tiny">在线开发者文档</p>
            </div>
          </div>
          <div className="action-list" style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ExternalLink size={13} />
              <a href="https://docs.dida.travel" target="_blank" rel="noopener noreferrer" style={{ color: "#4f5fb8" }}>
                docs.dida.travel
              </a>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 22 }}>
        <Card>
          <h3>核心接口列表</h3>
          <p className="tiny" style={{ marginBottom: 16 }}>以下为常用 REST 接口快速参考。</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--muted-strong)", fontWeight: 600 }}>方法</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--muted-strong)", fontWeight: 600 }}>路径</th>
                <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--muted-strong)", fontWeight: 600 }}>说明</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => (
                <tr key={ep.path} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      background: `${methodColor[ep.method]}18`,
                      color: methodColor[ep.method],
                    }}>
                      {ep.method}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <code style={{ fontSize: 12, color: "var(--text)" }}>{ep.path}</code>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--muted-strong)" }}>{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
