import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Plus, Trash2, UserCheck, UserX, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { User } from "@/data/users";

const API = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

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
    const data: ManagedUser[] = await fetch(`${API}/api/admin/users`, { headers: authHeaders }).then(r => r.json());
    setUsers(data);
    setLoading(false);
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
        <div style={{ overflowX: "auto", flex: 1, overflowY: "auto" }}>
          <table style={tableStyle}>
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
              ) : users.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? "#fff" : "var(--surface-soft)" }}>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.contact_name}</td>
                  <td style={tdStyle}>{u.channel_name}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: u.status === "active" ? "#f0fff4" : "#f4f4f5",
                      color: u.status === "active" ? "#16a34a" : "#6b7280",
                      border: `1px solid ${u.status === "active" ? "#bbf7d0" : "#d1d5db"}`,
                    }}>
                      {u.status === "active" ? "激活" : "禁用"}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {deleteConfirm === u.id ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--muted-strong)", whiteSpace: "nowrap" }}>确认删除?</span>
                        <button type="button" onClick={() => handleDelete(u.id)} style={dangerConfirmBtn}>确认</button>
                        <button type="button" onClick={() => setDeleteConfirm(null)} style={cancelSmBtn}>取消</button>
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <button type="button" onClick={() => handleToggle(u.id)} style={actionBtn}>
                          {u.status === "active"
                            ? <><UserX size={11} /> 禁用</>
                            : <><UserCheck size={11} /> 激活</>}
                        </button>
                        <button type="button" onClick={() => setDeleteConfirm(u.id)} style={deleteBtn}>
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
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse" };
const thStyle: CSSProperties = {
  padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
  color: "var(--muted-strong)", background: "var(--surface-soft)",
  borderBottom: "1px solid var(--line)", whiteSpace: "nowrap",
};
const tdStyle: CSSProperties = {
  padding: "9px 14px", fontSize: 13, color: "var(--text)",
  borderBottom: "1px solid var(--line)",
};
const emptyCellStyle: CSSProperties = {
  textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13,
};
const btnBase: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  height: 26, padding: "0 9px", borderRadius: 5,
  fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
};
const actionBtn: CSSProperties = {
  ...btnBase, border: "1px solid var(--line)", background: "var(--surface-soft)", color: "var(--text)",
};
const deleteBtn: CSSProperties = {
  ...btnBase, border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626",
};
const dangerConfirmBtn: CSSProperties = {
  ...btnBase, border: "none", background: "#dc2626", color: "#fff",
};
const cancelSmBtn: CSSProperties = {
  ...btnBase, border: "1px solid var(--line)", background: "#fff", color: "var(--muted-strong)",
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
