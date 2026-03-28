'use client';

import { useState, useCallback, useEffect, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationToast from './NotificationToast';
import LoginPage from '@/app/login/page';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { startReminderSystem } from '@/lib/reminders';
import type { AppNotification } from '@/lib/types';

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((n: AppNotification) => {
    setNotifications(prev => [...prev, n]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    if (!user) return;
    const cleanup = startReminderSystem(addNotification);
    return cleanup;
  }, [addNotification, user]);

  // Loading state
  if (loading) {
    return (
      <div className="login-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div className="login-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  // Not logged in — show login
  if (!user) {
    return <LoginPage />;
  }

  // Authenticated — show app
  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        {children}
      </main>
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthProvider>
  );
}
