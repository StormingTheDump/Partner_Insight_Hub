import "@/styles/tokens.css";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { authenticate } from '../data/users';
import type { User } from '../data/users';
import didaLogo from '@/assets/logo-DIDA_positive.svg';

interface Props {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }
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
        not_found: '账号不存在，请检查邮箱地址',
        wrong_password: '密码错误，请重新输入',
        disabled: '该账号已被禁用，请联系客户经理',
        network: '无法连接到服务器，请确认后端已启动',
      };
      setError(errMap[result.error!] ?? '登录失败，请稍后重试');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <img src={didaLogo} alt="DIDA" style={styles.logo} />
          <p style={styles.subtitle}>渠道管理平台 — 请登录您的账号</p>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorDot} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>邮箱账号</label>
            <div style={styles.inputWrap}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="123@agoda.com"
                autoComplete="off"
                style={styles.input}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>密码</label>
            <div style={styles.inputWrap}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Agoda123"
                autoComplete="new-password"
                style={{ ...styles.input, paddingRight: 44 }}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember */}
          <div style={styles.rememberRow}>
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={styles.checkbox}
              />
              记住登录状态
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <p style={styles.footer}>如需帮助，请联系您的专属客户经理</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: 'var(--font-family, "Poppins", "Harmony Sans SC", "Microsoft YaHei UI", system-ui, sans-serif)',
  },
  card: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    padding: '40px 36px 32px',
    width: '100%',
    maxWidth: 400,
    boxShadow: 'var(--shadow-elevated)',
    border: '1px solid var(--line)',
  },
  logoArea: {
    marginBottom: 28,
  },
  logo: {
    height: 52,
    display: 'block',
    marginBottom: 14,
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: 'var(--muted)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#fff5f5',
    border: '1px solid #ffc5c5',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    fontSize: 13,
    color: '#c0392b',
    marginBottom: 20,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#c0392b',
    flexShrink: 0,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--muted-strong)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    color: 'var(--muted)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    height: 42,
    paddingLeft: 38,
    paddingRight: 12,
    fontSize: 14,
    color: 'var(--text)',
    background: 'var(--surface-soft)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
  rememberRow: {
    marginBottom: 24,
    marginTop: 4,
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--muted-strong)',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: 'var(--dida-navy)',
    width: 14,
    height: 14,
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    height: 44,
    background: 'var(--dida-navy)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    letterSpacing: '0.02em',
    transition: 'opacity 0.15s',
  },
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--muted)',
  },
};
