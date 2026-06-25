import { useState, useEffect, type CSSProperties } from "react";
import { Mail, MessageCircle, Phone, Users, Briefcase, Settings2, Plus, Pencil, Trash2, Check, X, Headphones, Siren } from "lucide-react";
import type { PageProps } from "@/dashboard/routes";
import { Card } from "@/shared/components/Card";
import { PageHeader } from "@/shared/components/PageHeader";

const API = import.meta.env.VITE_API_BASE ?? "";

// ── icon map ──────────────────────────────────────────────────
const ICON_MAP: Record<string, React.FC<{ size?: number; style?: CSSProperties }>> = {
  MessageCircle, Phone, Mail, Users, Headphones, Siren,
};

// ── types ─────────────────────────────────────────────────────
type DidaField = { label: string; value: string };
type DidaContact = {
  id: number; title: string; subtitle: string;
  icon_key: string; color: string; bg_color: string;
  fields: DidaField[];
};

type MyContact = {
  id: number; type: "ops" | "biz";
  name: string; role: string; email: string; phone: string; wechat: string;
};

// ── ContactRow ────────────────────────────────────────────────
function ContactRow({ contact, onSave, onDelete }: {
  contact: MyContact;
  onSave: (c: MyContact) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(!contact.name);
  const [draft, setDraft] = useState({ ...contact });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await onSave(draft);
    setBusy(false);
    setEditing(false);
  };
  const cancel = () => { setDraft({ ...contact }); setEditing(false); };

  const field = (key: keyof MyContact, placeholder: string) => (
    <input
      value={draft[key] as string}
      onChange={e => setDraft({ ...draft, [key]: e.target.value })}
      placeholder={placeholder}
      style={inputStyle}
    />
  );

  if (editing) {
    return (
      <div style={rowCard}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {field("name", "姓名")}
          {field("role", "职位 / 角色")}
          {field("email", "邮箱")}
          {field("phone", "电话")}
          {field("wechat", "微信号")}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={cancel} disabled={busy} style={{ ...actionBtn, background: "var(--surface-soft)", color: "var(--muted-strong)" }}>
            <X size={13} /> 取消
          </button>
          <button type="button" onClick={save} disabled={busy} style={{ ...actionBtn, background: "var(--pih-primary)", color: "#fff" }}>
            <Check size={13} /> {busy ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={rowCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {contact.name || <span style={{ color: "var(--muted)" }}>（未填写）</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{contact.role}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={() => { setDraft({ ...contact }); setEditing(true); }} style={iconBtn} title="编辑">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={onDelete} style={{ ...iconBtn, color: "var(--status-danger)" }} title="删除">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 12px", marginTop: 10 }}>
        {contact.email && <InfoChip icon={<Mail size={11} />} label="邮箱" value={contact.email} />}
        {contact.phone && <InfoChip icon={<Phone size={11} />} label="电话" value={contact.phone} />}
        {contact.wechat && <InfoChip icon={<MessageCircle size={11} />} label="微信" value={contact.wechat} />}
        {!contact.email && !contact.phone && !contact.wechat && (
          <span style={{ fontSize: 12, color: "var(--muted)", gridColumn: "1/-1" }}>点击编辑填写联系方式</span>
        )}
      </div>
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--muted)", fontSize: 11, marginBottom: 1 }}>{icon}{label}</div>
      <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export function ContactPage(_: PageProps) {
  const [didaList, setDidaList] = useState<DidaContact[]>([]);
  const [myList, setMyList] = useState<MyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/contacts/dida`).then(r => r.json()),
      fetch(`${API}/api/contacts/my`).then(r => r.json()),
    ])
      .then(([dida, my]) => {
        setDidaList(Array.isArray(dida) ? dida : []);
        setMyList(Array.isArray(my) ? my : []);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "加载联系方式失败");
      })
      .finally(() => setLoading(false));
  }, []);

  const addContact = async (type: "ops" | "biz") => {
    const res = await fetch(`${API}/api/contacts/my`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name: "", role: type === "ops" ? "运营" : "商务", email: "", phone: "", wechat: "" }),
    });
    const created: MyContact = await res.json();
    setMyList(prev => [...prev, created]);
  };

  const saveContact = async (updated: MyContact) => {
    const res = await fetch(`${API}/api/contacts/my/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    const saved: MyContact = await res.json();
    setMyList(prev => prev.map(c => c.id === saved.id ? saved : c));
  };

  const deleteContact = async (id: number) => {
    await fetch(`${API}/api/contacts/my/${id}`, { method: "DELETE" });
    setMyList(prev => prev.filter(c => c.id !== id));
  };

  const ops = myList.filter(c => c.type === "ops");
  const biz = myList.filter(c => c.type === "biz");

  if (loading) return <div style={{ padding: 40, color: "var(--muted)" }}>加载中…</div>;
  if (loadError) return <div style={{ padding: 40, color: "var(--status-danger)" }}>联系方式加载失败：{loadError}</div>;

  return (
    <>
      <PageHeader title="联系方式" description="Dida 服务团队联系方式及我方对接人信息。" />

      {/* Dida 联系方式（只读） */}
      <section>
        <div style={sectionHeader}>
          <div style={sectionDot} />
          <h2 style={sectionTitle}>Dida 联系方式</h2>
          <span style={lockBadge}>只读</span>
        </div>
        <div className="grid two-col" style={{ marginTop: 12 }}>
          {didaList.map(c => {
            const Icon = ICON_MAP[c.icon_key] ?? Mail;
            return (
              <Card key={c.id}>
                <div className="card-header" style={{ justifyContent: "flex-start", gap: 12 }}>
                  <div className="icon-tile" style={{ background: c.bg_color, flexShrink: 0 }}>
                    <Icon size={16} style={{ color: c.color }} />
                  </div>
                  <div>
                    <h3>{c.title}</h3>
                    <p className="tiny">{c.subtitle}</p>
                  </div>
                </div>
                <div className="action-list" style={{ marginTop: 12 }}>
                  {c.fields.map(f => (
                    <div key={f.label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span className="muted" style={{ fontSize: 12, flexShrink: 0 }}>{f.label}</span>
                      <strong style={{ fontSize: 12, textAlign: "right" }}>{f.value}</strong>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 我方对接人（可编辑） */}
      <section style={{ marginTop: 32 }}>
        <div style={sectionHeader}>
          <div style={{ ...sectionDot, background: "#10B981" }} />
          <h2 style={sectionTitle}>我方对接人</h2>
          <span style={{ ...lockBadge, background: "#DEF7E7", color: "#10B981", border: "1px solid #A7F3D0" }}>可编辑</span>
        </div>

        <div className="grid two-col" style={{ marginTop: 12 }}>
          {/* 运营对接人 */}
          <Card>
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="icon-tile" style={{ background: "var(--pih-primary-soft)", flexShrink: 0 }}>
                  <Settings2 size={16} style={{ color: "#505AAC" }} />
                </div>
                <div>
                  <h3>运营对接人</h3>
                  <p className="tiny">负责日常运营与系统对接</p>
                </div>
              </div>
              <button type="button" onClick={() => addContact("ops")} style={addBtn}>
                <Plus size={13} /> 添加
              </button>
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {ops.length === 0 ? (
                <p className="tiny" style={{ color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
                  暂无运营对接人，点击「添加」新增
                </p>
              ) : (
                ops.map(c => (
                  <ContactRow
                    key={c.id} contact={c}
                    onSave={saveContact}
                    onDelete={() => deleteContact(c.id)}
                  />
                ))
              )}
            </div>
          </Card>

          {/* 商务对接人 */}
          <Card>
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="icon-tile" style={{ background: "#FDE3E3", flexShrink: 0 }}>
                  <Briefcase size={16} style={{ color: "#EF4444" }} />
                </div>
                <div>
                  <h3>商务对接人</h3>
                  <p className="tiny">负责商务谈判与合同对接</p>
                </div>
              </div>
              <button type="button" onClick={() => addContact("biz")} style={addBtn}>
                <Plus size={13} /> 添加
              </button>
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {biz.length === 0 ? (
                <p className="tiny" style={{ color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
                  暂无商务对接人，点击「添加」新增
                </p>
              ) : (
                biz.map(c => (
                  <ContactRow
                    key={c.id} contact={c}
                    onSave={saveContact}
                    onDelete={() => deleteContact(c.id)}
                  />
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

// ── styles ────────────────────────────────────────────────────
const sectionHeader: CSSProperties = { display: "flex", alignItems: "center", gap: 10 };
const sectionDot: CSSProperties = { width: 4, height: 18, borderRadius: 2, background: "var(--pih-primary)", flexShrink: 0 };
const sectionTitle: CSSProperties = { margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-strong)" };
const lockBadge: CSSProperties = { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "#f4f4f5", color: "var(--muted-strong)", border: "1px solid var(--line)" };
const rowCard: CSSProperties = { background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 14px" };
const inputStyle: CSSProperties = {
  width: "100%", height: 34, padding: "0 10px", fontSize: 13,
  border: "1px solid var(--line)", borderRadius: 6, outline: "none",
  background: "var(--surface)", color: "var(--text)", boxSizing: "border-box",
};
const actionBtn: CSSProperties = {
  display: "flex", alignItems: "center", gap: 4, padding: "5px 12px",
  borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
};
const iconBtn: CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, borderRadius: 6, border: "1px solid var(--line)",
  background: "var(--surface)", cursor: "pointer", color: "var(--muted-strong)",
};
const addBtn: CSSProperties = {
  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6,
  border: "1px solid var(--pih-primary)", background: "transparent",
  color: "var(--pih-primary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
};
