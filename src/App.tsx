import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import { MetricsPage, OrdersPage, MatchingPage, FinancePage, ContactPage } from './pages/Placeholders';
import type { User } from './data/users';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored =
      localStorage.getItem('pih_user') || sessionStorage.getItem('pih_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1a73e8', borderRadius: 8 } }}>
      <BrowserRouter basename="/Partner_Insight_Hub">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={setUser} />}
          />
          <Route
            path="/dashboard"
            element={user ? <DashboardLayout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />}
          >
            <Route index element={<Navigate to="metrics" replace />} />
            <Route path="metrics"  element={<MetricsPage />} />
            <Route path="orders"   element={<OrdersPage />} />
            <Route path="matching" element={<MatchingPage />} />
            <Route path="finance"  element={<FinancePage />} />
            <Route path="contact"  element={<ContactPage />} />
          </Route>
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
