import "@/styles/tokens.css";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';
import { authenticate } from '../data/users';
import type { User } from '../data/users';
import didaLogo from '@/assets/logo-DIDA_positive.svg';

interface Props {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember]         = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('请输入邮箱和密码'); return; }
    setLoading(true);
    setError(null);
    const result = await authenticate(email, password);
    if (result.success && result.user) {
      const payload = { ...result.user, token: result.token };
      if (remember) {
        localStorage.setItem('pih_user', JSON.stringify(payload));
      } else {
        sessionStorage.setItem('pih_user', JSON.stringify(payload));
      }
      onLogin(payload);
      navigate('/dashboard');
    } else {
      const errMap: Record<string, string> = {
        not_found:     '账号不存在，请检查邮箱地址',
        wrong_password:'密码错误，请重新输入',
        disabled:      '该账号已被禁用，请联系客户经理',
        network:       '无法连接到服务器，请确认后端已启动',
      };
      setError(errMap[result.error!] ?? '登录失败，请稍后重试');
    }
    setLoading(false);
  };

  return (
    <div style={page}>

      {/* ── Left brand panel ── */}
      <div style={brand}>
        {/* Decorative circles */}
        <div style={deco1} />
        <div style={deco2} />
        <div style={deco3} />
        <div style={dotGrid} />

        <div style={brandInner}>
          {/* Logo */}
          <img src={didaLogo} alt="DIDA" style={logo} />

          {/* Headline */}
          <div style={headline}>
            AI 驱动的旅游资源
            <br />智能分发服务商
          </div>

          {/* Pills */}
          <div style={pills}>
            {['智能', '高效', '全球互联'].map((t, i) => (
              <>
                {i > 0 && <span key={`sep${i}`} style={pipeSep}>|</span>}
                <span key={t} style={pill}>{t}</span>
              </>
            ))}
          </div>

          {/* Description */}
          <p style={desc}>
            融合最智能的旅行科技与人工智能，汇聚行业顶尖人才，
            化繁为简，创造价值，为全球 B2B 合作伙伴提供
            无缝衔接的旅游分销服务。
          </p>

          {/* Feature highlights */}
          <div style={features}>
            {[
              { icon: '🌐', label: '全球覆盖', sub: '200+ 国家与地区' },
              { icon: '⚡', label: '实时接入', sub: '毫秒级 API 响应' },
              { icon: '🔒', label: '安全合规', sub: '企业级数据保护' },
            ].map(f => (
              <div key={f.label} style={featureItem}>
                <span style={featureIcon}>{f.icon}</span>
                <div>
                  <div style={featureLabel}>{f.label}</div>
                  <div style={featureSub}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={brandFooter}>© 2025 Dida Travel · 全球 B2B 旅游分销平台</div>
      </div>

      {/* ── Right form panel ── */}
      <div style={formSide}>
        <div style={formCard}>

          {/* Form header */}
          <div style={formTop}>
            <div style={platformTag}>渠道管理平台</div>
            <h2 style={formTitle}>欢迎回来</h2>
            <p style={formSub}>登录您的合作伙伴账号，查看专属数据报告</p>
          </div>

          {/* Error */}
          {error && (
            <div style={errorBox}>
              <span style={errorDot} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={fieldGroup}>
              <label style={fieldLabel}>邮箱账号</label>
              <div style={inputWrap}>
                <Mail size={15} style={inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit(e as unknown as React.FormEvent)}
                  placeholder="your@email.com"
                  autoComplete="username"
                  style={input}
                />
              </div>
            </div>

            {/* Password */}
            <div style={fieldGroup}>
              <label style={fieldLabel}>密码</label>
              <div style={inputWrap}>
                <Lock size={15} style={inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...input, paddingRight: 44 }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  style={eyeBtn}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div style={rememberRow}>
              <label style={checkLabel}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={checkbox}
                />
                记住登录状态
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ ...submitBtn, opacity: loading ? 0.75 : 1 }}
            >
              {loading ? <span style={spinner} /> : <LogIn size={15} />}
              {loading ? '登录中…' : '登 录'}
            </button>
          </form>

          <p style={helpText}>如需帮助，请联系您的专属客户经理</p>
        </div>
      </div>

    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const ff = '"Poppins","Harmony Sans SC","Microsoft YaHei UI",system-ui,sans-serif';

const page: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  fontFamily: ff,
};

/* ── Brand panel ── */
const brand: React.CSSProperties = {
  flex: '0 0 52%',
  background: 'linear-gradient(150deg, #ffffff 0%, #fff7f9 35%, #ffecf0 65%, #ffd9e4 100%)',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '48px 52px',
};

/* decorative circles */
const deco1: React.CSSProperties = {
  position: 'absolute', top: -80, right: -80,
  width: 380, height: 380, borderRadius: '50%',
  background: 'rgba(234,3,69,0.10)',
  filter: 'blur(60px)',
};
const deco2: React.CSSProperties = {
  position: 'absolute', bottom: -100, left: -60,
  width: 280, height: 280, borderRadius: '50%',
  background: 'rgba(234,3,69,0.04)',
  border: '1px solid rgba(234,3,69,0.09)',
};
const deco3: React.CSSProperties = {
  position: 'absolute', top: '38%', right: 60,
  width: 120, height: 120, borderRadius: '50%',
  border: '1.5px solid rgba(234,3,69,0.16)',
};
const dotGrid: React.CSSProperties = {
  position: 'absolute', inset: 0,
  backgroundImage: 'radial-gradient(circle, rgba(234,3,69,0.06) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
};

const brandInner: React.CSSProperties = {
  position: 'relative', zIndex: 1, flex: 1,
  display: 'flex', flexDirection: 'column', gap: 0,
};

const logo: React.CSSProperties = {
  height: 210, display: 'block', marginBottom: 28,
};

const headline: React.CSSProperties = {
  fontSize: 54, fontWeight: 800, lineHeight: 1.25,
  color: '#000947', letterSpacing: '-0.01em', marginBottom: 20,
};

const pills: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
};
const pill: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#ea0345',
  background: 'rgba(234,3,69,0.07)',
  border: '1px solid rgba(234,3,69,0.18)',
  borderRadius: 99, padding: '3px 12px',
};
const pipeSep: React.CSSProperties = {
  color: 'rgba(0,9,71,0.20)', fontSize: 12,
};

const desc: React.CSSProperties = {
  fontSize: 13.5, lineHeight: 1.75, color: 'rgba(0,9,71,0.55)',
  margin: '0 0 32px 0', maxWidth: 360,
};

const features: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 18,
};
const featureItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
};
const featureIcon: React.CSSProperties = {
  fontSize: 22, width: 40, height: 40,
  background: 'rgba(234,3,69,0.06)',
  border: '1px solid rgba(234,3,69,0.13)',
  borderRadius: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
const featureLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#000947', marginBottom: 2,
};
const featureSub: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,9,71,0.45)',
};

const brandFooter: React.CSSProperties = {
  position: 'relative', zIndex: 1,
  fontSize: 11, color: 'rgba(0,9,71,0.32)',
  paddingTop: 24, borderTop: '1px solid rgba(234,3,69,0.10)',
};

/* ── Form panel ── */
const formSide: React.CSSProperties = {
  flex: 1,
  background: '#f4f5f9',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '40px 24px',
};
const formCard: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '62px 62px 50px',
  width: '100%', maxWidth: 655,
  boxShadow: '0 4px 32px rgba(0,9,71,0.08)',
  border: '1px solid rgba(0,9,71,0.07)',
};
const formTop: React.CSSProperties = { marginBottom: 43 };
const platformTag: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 17, fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#ea0345',
  background: 'rgba(234,3,69,0.08)',
  border: '1px solid rgba(234,3,69,0.2)',
  borderRadius: 99, padding: '5px 16px', marginBottom: 22,
};
const formTitle: React.CSSProperties = {
  margin: '0 0 12px', fontSize: 37, fontWeight: 800,
  color: '#000947', letterSpacing: '-0.02em',
};
const formSub: React.CSSProperties = {
  margin: 0, fontSize: 20, color: '#6b7280', lineHeight: 1.5,
};

const errorBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: '#fff5f5', border: '1px solid #ffc5c5',
  borderRadius: 8, padding: '10px 14px',
  fontSize: 13, color: '#c0392b', marginBottom: 20,
};
const errorDot: React.CSSProperties = {
  width: 6, height: 6, borderRadius: '50%',
  background: '#c0392b', flexShrink: 0,
};

const fieldGroup: React.CSSProperties = { marginBottom: 28 };
const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: 18, fontWeight: 600,
  color: '#374151', marginBottom: 10,
  letterSpacing: '0.02em',
};
const inputWrap: React.CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center',
};
const inputIcon: React.CSSProperties = {
  position: 'absolute', left: 20, color: '#9ca3af', pointerEvents: 'none',
};
const input: React.CSSProperties = {
  width: '100%', height: 68, paddingLeft: 62, paddingRight: 22,
  fontSize: 22, color: '#111827',
  background: '#f9fafb',
  border: '1.5px solid #e5e7eb',
  borderRadius: 8, outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
const eyeBtn: React.CSSProperties = {
  position: 'absolute', right: 20,
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0,
};
const rememberRow: React.CSSProperties = { marginBottom: 37, marginTop: 2 };
const checkLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 20, color: '#6b7280', cursor: 'pointer',
};
const checkbox: React.CSSProperties = {
  accentColor: '#000947', width: 22, height: 22, cursor: 'pointer',
};
const submitBtn: React.CSSProperties = {
  width: '100%', height: 72,
  background: 'linear-gradient(135deg, #000947 0%, #0b1a6e 100%)',
  color: '#fff', border: 'none', borderRadius: 8,
  fontSize: 23, fontWeight: 700, letterSpacing: '0.06em',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  transition: 'opacity 0.15s',
  boxShadow: '0 4px 16px rgba(0,9,71,0.28)',
};
const spinner: React.CSSProperties = {
  width: 16, height: 16,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
  display: 'inline-block',
};
const helpText: React.CSSProperties = {
  marginTop: 20, textAlign: 'center',
  fontSize: 12, color: '#9ca3af', lineHeight: 1.5,
};
