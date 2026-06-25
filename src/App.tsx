import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import { AppShell } from './dashboard/AppShell';
import type { User } from './data/users';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('pih_user') || sessionStorage.getItem('pih_user');
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const handleLogout = () => setUser(null);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{ token: { colorPrimary: '#505AAC', borderRadius: 7 } }}
    >
      <BrowserRouter basename="/Partner_Insight_Hub">
        <Routes>
          <Route
            path="/login"
            element={
              user
                ? <Navigate to="/dashboard" replace />
                : <Login onLogin={setUser} />
            }
          />
          <Route
            path="/dashboard/*"
            element={
              user
                ? <AppShell user={user} onLogout={handleLogout} />
                : <Navigate to="/login" replace />
            }
          />
          <Route
            path="*"
            element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
          />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
