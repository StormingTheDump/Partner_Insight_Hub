export type UserStatus = 'active' | 'disabled';

export interface User {
  id: number;
  email: string;
  channelName: string;
  contactName: string;
  status: UserStatus;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export async function authenticate(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, user: data.user, token: data.token };
    }

    const err = await res.json();
    const msg: string = err.detail ?? '登录失败，请稍后重试';

    if (msg.includes('不存在')) return { success: false, error: 'not_found' };
    if (msg.includes('密码错误')) return { success: false, error: 'wrong_password' };
    if (msg.includes('禁用')) return { success: false, error: 'disabled' };
    return { success: false, error: 'unknown' };
  } catch {
    return { success: false, error: 'network' };
  }
}

