import { Mail, MessageCircle, Phone, Users } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { Card } from "@/shared/components/Card";
import { PageHeader } from "@/shared/components/PageHeader";

export function ContactPage(_: PageProps) {
  return (
    <>
      <PageHeader title="联系方式" description="获取 Dida 团队的支持与帮助。" />
      <div className="grid two-col">
        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 14 }}>
            <div className="icon-tile" style={{ background: "#eef1ff" }}>
              <MessageCircle className="icon" style={{ color: "#4f5fb8" }} />
            </div>
            <div>
              <h3>客户经理</h3>
              <p className="tiny">您的专属合作伙伴支持联系人</p>
            </div>
          </div>
          <div className="action-list" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">姓名</span>
              <strong>Dida 客户成功团队</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">邮箱</span>
              <strong>partner-support@dida.travel</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">响应时间</span>
              <strong>工作日 24 小时内</strong>
            </div>
          </div>
        </Card>
        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 14 }}>
            <div className="icon-tile" style={{ background: "#fff0f5" }}>
              <Phone className="icon" style={{ color: "#ea0345" }} />
            </div>
            <div>
              <h3>技术支持</h3>
              <p className="tiny">API 集成与技术问题</p>
            </div>
          </div>
          <div className="action-list" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">邮箱</span>
              <strong>tech-support@dida.travel</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">服务时间</span>
              <strong>7×24 小时</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">紧急热线</span>
              <strong>+86 400-XXX-XXXX</strong>
            </div>
          </div>
        </Card>
        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 14 }}>
            <div className="icon-tile" style={{ background: "#f0fff4" }}>
              <Mail className="icon" style={{ color: "#16a34a" }} />
            </div>
            <div>
              <h3>商务合作</h3>
              <p className="tiny">渠道拓展与合作意向</p>
            </div>
          </div>
          <div className="action-list" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">邮箱</span>
              <strong>bd@dida.travel</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">响应时间</span>
              <strong>工作日 48 小时内</strong>
            </div>
          </div>
        </Card>
        <Card>
          <div className="card-header" style={{ justifyContent: "flex-start", gap: 14 }}>
            <div className="icon-tile" style={{ background: "#fffbeb" }}>
              <Users className="icon" style={{ color: "#d97706" }} />
            </div>
            <div>
              <h3>团队微信群</h3>
              <p className="tiny">实时沟通与问题反馈</p>
            </div>
          </div>
          <p className="tiny" style={{ marginTop: 12 }}>
            请联系您的客户经理申请加入 Dida 合作伙伴专属微信群，获取最新公告和快速响应支持。
          </p>
        </Card>
      </div>
    </>
  );
}
