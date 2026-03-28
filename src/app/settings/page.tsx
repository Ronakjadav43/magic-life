'use client';

import { useEffect, useState } from 'react';
import { Save, Clock, MessageCircle, Bell, RotateCcw } from 'lucide-react';
import { getSettings, saveSettings } from '@/lib/store';
import type { UserSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    dailyReminderTime: '10:00',
    overdueReminderTime: '09:00',
    whatsappNumber: '919723242591',
  });
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    // Clear reminder flags so new times take effect
    localStorage.removeItem('ops_last_reminder');
    localStorage.removeItem('ops_last_entry_reminder');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaults: UserSettings = {
      dailyReminderTime: '10:00',
      overdueReminderTime: '09:00',
      whatsappNumber: '919723242591',
    };
    setSettings(defaults);
    saveSettings(defaults);
    localStorage.removeItem('ops_last_reminder');
    localStorage.removeItem('ops_last_entry_reminder');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const formatPhoneDisplay = (num: string) => {
    if (num.startsWith('91') && num.length === 12) {
      return `+91 ${num.slice(2, 7)} ${num.slice(7)}`;
    }
    return `+${num}`;
  };

  return (
    <div className="page fade-in">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Configure your reminder times and notification preferences</p>

      {saved && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: 'var(--accent-emerald)',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ✅ Settings saved! Reminders will use your new times.
        </div>
      )}

      {/* Reminder Settings */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Bell size={20} style={{ color: 'var(--accent-amber)' }} />
          Reminder Schedule
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          Set your preferred times for daily reminders. The system checks every 60 seconds and triggers once per day at or after your set time.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: 'var(--accent-amber)' }} />
              Daily Entry Reminder Time
            </label>
            <input
              type="time"
              className="form-control"
              value={settings.dailyReminderTime}
              onChange={e => setSettings({ ...settings, dailyReminderTime: e.target.value })}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              If you haven&apos;t logged any entry by this time, you&apos;ll get a reminder notification + WhatsApp alert option
            </p>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: 'var(--accent-rose)' }} />
              Overdue Task Reminder Time
            </label>
            <input
              type="time"
              className="form-control"
              value={settings.overdueReminderTime}
              onChange={e => setSettings({ ...settings, overdueReminderTime: e.target.value })}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              If you have overdue tasks, you&apos;ll be alerted at this time with toast + browser notification
            </p>
          </div>
        </div>

        {/* Visual time preview */}
        <div style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
        }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
            📅 Your Daily Reminder Schedule
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--accent-rose)', flexShrink: 0,
              }} />
              <span style={{ fontWeight: 600 }}>{settings.overdueReminderTime}</span>
              <span style={{ color: 'var(--text-secondary)' }}>— Overdue tasks alert</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--accent-amber)', flexShrink: 0,
              }} />
              <span style={{ fontWeight: 600 }}>{settings.dailyReminderTime}</span>
              <span style={{ color: 'var(--text-secondary)' }}>— Daily entry reminder</span>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Settings */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <MessageCircle size={20} style={{ color: '#25D366' }} />
          WhatsApp Settings
        </h3>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            WhatsApp Number (with country code, no +)
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. 919723242591"
            value={settings.whatsappNumber}
            onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value.replace(/[^0-9]/g, '') })}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Display: {formatPhoneDisplay(settings.whatsappNumber)} — All WhatsApp reminders will be sent to this number
          </p>
        </div>
      </div>

      {/* Save & Reset */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Settings
        </button>
        <button className="btn btn-secondary" onClick={handleReset}>
          <RotateCcw size={16} /> Reset to Defaults
        </button>
      </div>
    </div>
  );
}
