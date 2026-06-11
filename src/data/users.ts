export type UserStatus = 'active' | 'disabled';

export interface User {
  id: number;
  email: string;
  password: string;
  channelName: string;
  contactName: string;
  status: UserStatus;
}

export const users: User[] = [
  {
    id: 1,
    email: 'partner_a@example.com',
    password: 'Pass1234!',
    channelName: 'Booking Agency A',
    contactName: 'Alice Chen',
    status: 'active',
  },
  {
    id: 2,
    email: 'partner_b@example.com',
    password: 'Pass5678!',
    channelName: 'Travel Hub B',
    contactName: 'Bob Wang',
    status: 'active',
  },
  {
    id: 3,
    email: 'partner_c@example.com',
    password: 'Pass9999!',
    channelName: 'Global Tours C',
    contactName: 'Carol Liu',
    status: 'active',
  },
  {
    id: 4,
    email: 'test_user@example.com',
    password: 'Test0000!',
    channelName: 'Test Channel',
    contactName: 'Test User',
    status: 'active',
  },
  {
    id: 5,
    email: 'disabled@example.com',
    password: 'Dis1111!',
    channelName: 'Disabled Channel',
    contactName: 'Dave Zhang',
    status: 'disabled',
  },
];

export function authenticate(email: string, password: string): {
  success: boolean;
  user?: User;
  error?: 'not_found' | 'wrong_password' | 'disabled';
} {
  const user = users.find((u) => u.email === email);
  if (!user) return { success: false, error: 'not_found' };
  if (user.status === 'disabled') return { success: false, error: 'disabled' };
  if (user.password !== password) return { success: false, error: 'wrong_password' };
  return { success: true, user };
}
