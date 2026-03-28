'use client';

import { useState, useCallback, useEffect, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationToast from './NotificationToast';
import { startReminderSystem } from '@/lib/reminders';
import type { AppNotification } from '@/lib/types';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((n: AppNotification) => {
    setNotifications(prev => [...prev, n]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    const cleanup = startReminderSystem(addNotification);
    return cleanup;
  }, [addNotification]);

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
