import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Plus, Trash2, UserCheck, UserX, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { User } from "@/data/users";

const API = import.meta.env.VITE_API_BASE ?? "";

type ManagedUser = {
  id: number;
  email: string;
  channel_name: string;
  contact_name: string;
  status: "active" | "disabled";
};

type Props = {
  open: boolean;
  adminUser: User;
  onClose: () => void;
};

export function AccountManagementModal({ open, adminUser, onClose }: Props) {
  const [users, setUsers]               = useState<ManagedUser[]>([]);
  const [loading, setLoading]           = useState(false);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [form, setForm] = useState({ email: "", password: "", channel_name: "", contact_name: "" });
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminUser.token ?? ""}`,
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: authHeaders });
      if (!res.ok) {
        const msg = await res.json().then((d: { detail?: string }) => d.detail ?? res.statusText).catch(() => res.statusText);
        setError(msg);
        setUsers([]);
      } else {
        const data: ManagedUser[] = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [adminUser.token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) fetchUsers();
  }, [open, fetchUsers]);

  if (!open) return null;

  const handleToggle = async (id: number) => {
    await fetch(`${API}/api/admin/users/${id}/status`, { method: "PATCH", headers: authHeaders });
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API}/api/admin/users/${id}`, { method: "DELETE", headers: authHeaders });
    setDeleteConfirm(null);
    fetchUsers();
  };

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.channel_name || !form.contact_name) {
      setError("请填写所有字段");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`${API}/api/admin/users`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.detail ?? "创建失败");
    } else {
      setForm({ email: "", password: "", channel_name: "", contact_name: "" });
      setShowAddForm(false);
      fetchUsers();
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setError(null);
    setForm({ email: "", password: "", channel_name: "", contact_name: "" });
  };

  return createPortal(
    <>
      <div style={backdrop} onClick={onClose}>
        <div style={modalWrap} onClick={e => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>账号管理</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {adminUser.email} 下的账号
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtn}>
            <X size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="table-wrap" style={{ flex: 1, overflowY: "auto" }}>
          <table>
            <thead>
              <tr>
                <th style={thStyle}>邮箱</th>
                <th style={thStyle}>联系人</th>
                <th style={thStyle}>渠道名称</th>
                <th style={thStyle}>状态</th>
                <th style={{ ...thStyle, width: 180 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={emptyCellStyle}>加载中…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={emptyCellStyle}>暂无账号，点击下方新增</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.contact_name}</td>
                  <td style={tdStyle}>{u.channel_name}</td>
                  <td style={tdStyle}>
                    <span className={u.status === "active" ? "status" : "status neutral"}>
                      {u.status === "active" ? "激活" : "禁用"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {deleteConfirm === u.id ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--muted-strong)", whiteSpace: "nowrap" }}>确认删除?</span>
                        <button type="button" onClick={() => handleDelete(u.id)} className="button danger" style={{ height: 26, padding: "0 8px", fontSize: 11 }}>确认</button>
                        <button type="button" onClick={() => setDeleteConfirm(null)} className="button" style={{ height: 26, padding: "0 8px", fontSize: 11 }}>取消</button>
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <button type="button" onClick={() => handleToggle(u.id)} className="button" style={{ height: 26, padding: "0 8px", fontSize: 11 }}>
                          {u.status === "active"
                            ? <><UserX size={11} /> 禁用</>
                            : <><UserCheck size={11} /> 激活</>}
                        </button>
                        <button type="button" onClick={() => setDeleteConfirm(u.id)} className="button danger" style={{ height: 26, padding: "0 8px", fontSize: 11 }}>
                          <Trash2 size={11} /> 删除
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div style={addFormWrap}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>新增账号</div>
            {error && (
              <div style={errorBox}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
            <div style={formGrid}>
              {[
                { key: "email" as const,        label: "邮箱",   placeholder: "user@agoda.com", type: "text" },
                { key: "password" as const,     label: "密码",   placeholder: "初始密码",        type: "password" },
                { key: "channel_name" as const, label: "渠道名称", placeholder: "Agoda",         type: "text" },
                { key: "contact_name" as const, label: "联系人",  placeholder: "姓名",            type: "text" },
              ].map(f => (
                <div key={f.key} style={fieldWrap}>
                  <label style={labelStyle}>{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button type="button" onClick={resetForm} style={cancelMdBtn}>取消</button>
              <button type="button" onClick={handleCreate} disabled={submitting}
                style={{ ...submitBtn, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "创建中…" : "创建账号"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!showAddForm && (
          <div style={modalFooter}>
            <button type="button" onClick={() => { setShowAddForm(true); setError(null); }} style={addBtn}>
              <Plus size={14} /> 新增账号
            </button>
          </div>
        )}
      </div>
      </div>
    </>,
    document.body
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const backdrop: CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "20px",
};
const modalWrap: CSSProperties = {
  background: "#fff", borderRadius: 12,
  width: 700, maxWidth: "100%", maxHeight: "80vh",
  display: "flex", flexDirection: "column",
  boxShadow: "0 20px 60px rgba(0,0,0,0.18)", zIndex: 1001, overflow: "hidden",
};
const modalHeader: CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "16px 20px", borderBottom: "1px solid var(--line)", flexShrink: 0,
};
const closeBtn: CSSProperties = {
  width: 30, height: 30, borderRadius: 6,
  border: "1px solid var(--line)", background: "var(--surface-soft)",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--muted-strong)",
};
const thStyle: CSSProperties = {
  position: "sticky", top: 0, zIndex: 2,
  background: "#f8fafd", color: "#526078",
  fontSize: 12, fontWeight: 800,
  padding: "11px 13px",
  borderBottom: "2px solid var(--line)",
  whiteSpace: "nowrap", verticalAlign: "middle", textAlign: "left",
};
const tdStyle: CSSProperties = {
  padding: "11px 13px",
  borderBottom: "1px solid var(--line-soft)",
  verticalAlign: "middle", textAlign: "left", whiteSpace: "nowrap",
};
const emptyCellStyle: CSSProperties = {
  textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13,
};
const addFormWrap: CSSProperties = {
  borderTop: "1px solid var(--line)", padding: "16px 20px", background: "var(--surface-soft)", flexShrink: 0,
};
const errorBox: CSSProperties = {
  display: "flex", alignItems: "center", gap: 7,
  background: "#fff5f5", border: "1px solid #ffc5c5", borderRadius: 6,
  padding: "8px 12px", fontSize: 12, color: "#c0392b", marginBottom: 10,
};
const formGrid: CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px",
};
const fieldWrap: CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const labelStyle: CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "var(--muted-strong)",
  textTransform: "uppercase", letterSpacing: "0.04em",
};
const inputStyle: CSSProperties = {
  height: 34, padding: "0 10px", borderRadius: 6,
  border: "1px solid var(--line)", background: "#fff",
  fontSize: 13, color: "var(--text)", outline: "none",
};
const cancelMdBtn: CSSProperties = {
  height: 32, padding: "0 14px", borderRadius: 6,
  border: "1px solid var(--line)", background: "#fff",
  cursor: "pointer", fontSize: 13, color: "var(--muted-strong)",
};
const submitBtn: CSSProperties = {
  height: 32, padding: "0 16px", borderRadius: 6,
  border: "none", background: "var(--dida-navy)", color: "#fff",
  cursor: "pointer", fontSize: 13, fontWeight: 600,
};
const modalFooter: CSSProperties = {
  padding: "12px 20px", borderTop: "1px solid var(--line)", flexShrink: 0,
};
const addBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  height: 32, padding: "0 14px", borderRadius: 6,
  border: "1px solid var(--line)", background: "var(--surface-soft)",
  cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text)",
};
