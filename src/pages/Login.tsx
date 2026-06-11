import { useState } from 'react';
import { Form, Input, Button, Checkbox, Alert, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authenticate } from '../data/users';
import type { User } from '../data/users';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

interface Props {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    setError(null);
    const result = await authenticate(values.email, values.password);
    if (result.success && result.user) {
      const payload = { ...result.user, token: result.token };
      if (values.remember) {
        localStorage.setItem('pih_user', JSON.stringify(payload));
      } else {
        sessionStorage.setItem('pih_user', JSON.stringify(payload));
      }
      onLogin(result.user);
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
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>D</div>
          <Title level={3} style={styles.logoText}>Partner Insight Hub</Title>
        </div>
        <Text type="secondary" style={styles.subtitle}>渠道开放平台 — 请登录您的账号</Text>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit} size="large" initialValues={{ remember: true }}>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱格式' },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#aaa' }} />} placeholder="邮箱账号" style={styles.input} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#aaa' }} />} placeholder="密码" style={styles.input} />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 24 }}>
            <Checkbox>记住登录状态</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={styles.loginBtn}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" style={styles.footer}>
          如需帮助，请联系您的专属客户经理
        </Text>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f1b35 0%, #1a3a6b 50%, #1a73e8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '48px 40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: 'linear-gradient(135deg, #1a73e8, #0f1b35)',
    borderRadius: 8,
    color: '#fff',
    fontWeight: 700,
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    margin: 0,
    color: '#0f1b35',
    fontSize: 18,
  },
  subtitle: {
    display: 'block',
    marginBottom: 28,
    fontSize: 13,
  },
  input: {
    borderRadius: 8,
    height: 44,
  },
  loginBtn: {
    height: 46,
    borderRadius: 8,
    background: 'linear-gradient(90deg, #1a73e8, #0f5bbf)',
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 1,
  },
  footer: {
    display: 'block',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
};
