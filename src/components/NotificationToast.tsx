'use client';

import { useEffect, useRef } from 'react';
import { X, Bell, AlertTriangle, CheckCircle2, Info, MessageCircle } from 'lucide-react';
import type { AppNotification } from '@/lib/types';

interface NotificationToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

const ICON_MAP = {
  info: Info,
  success: CheckCircle2,
  warning: Bell,
  error: AlertTriangle,
};

const COLOR_MAP = {
  info: 'var(--accent-blue)',
  success: 'var(--accent-emerald)',
  warning: 'var(--accent-amber)',
  error: 'var(--accent-rose)',
};

const BG_MAP = {
  info: 'rgba(59,130,246,0.12)',
  success: 'rgba(16,185,129,0.12)',
  warning: 'rgba(245,158,11,0.12)',
  error: 'rgba(244,63,94,0.12)',
};

export default function NotificationToast({ notifications, onDismiss }: NotificationToastProps) {
  return (
    <div className="toast-container">
      {notifications.map(n => (
        <ToastItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ notification, onDismiss }: { notification: AppNotification; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const Icon = ICON_MAP[notification.type];

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(notification.id), 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [notification.id, onDismiss]);

  const handleWhatsApp = () => {
    if (notification.whatsappAction) {
      notification.whatsappAction();
    }
  };

  return (
    <div
      className="toast-item"
      style={{
        borderLeft: `3px solid ${COLOR_MAP[notification.type]}`,
        background: BG_MAP[notification.type],
      }}
    >
      <div className="toast-icon" style={{ color: COLOR_MAP[notification.type] }}>
        <Icon size={18} />
      </div>
      <div className="toast-body">
        <div className="toast-title">{notification.title}</div>
        <div className="toast-message">{notification.message}</div>
        {notification.whatsappAction && (
          <button className="toast-whatsapp-btn" onClick={handleWhatsApp}>
            <MessageCircle size={14} /> Send to WhatsApp
          </button>
        )}
      </div>
      <button className="toast-close" onClick={() => onDismiss(notification.id)}>
        <X size={14} />
      </button>
    </div>
  );
}
