// Reminder system for the Personal Ops System
import { getEntries, getOverdueTasks, todayStr, generateId, getSettings } from './store';
import { sendDailyReminderToWhatsApp, sendOverdueToWhatsApp } from './whatsapp';
import type { AppNotification } from './types';

const REMINDER_KEY = 'ops_last_reminder';
const ENTRY_REMINDER_KEY = 'ops_last_entry_reminder';

type AddNotification = (notification: AppNotification) => void;

function getLastReminderDate(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function setLastReminderDate(key: string, date: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, date);
}

// Parse "HH:MM" to { hour, minute }
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

// Check if current time >= target time
function isTimeReached(timeStr: string): boolean {
  const now = new Date();
  const { hour, minute } = parseTime(timeStr);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = hour * 60 + minute;
  return currentMinutes >= targetMinutes;
}

// Request browser notification permission
export function requestNotificationPermission(): void {
  if (typeof window === 'undefined') return;
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Send native browser notification
function sendBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined') return;
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
  }
}

// Check at user-set time if no entry logged today
function checkDailyEntryReminder(addNotification: AddNotification): void {
  const today = todayStr();
  const lastReminder = getLastReminderDate(ENTRY_REMINDER_KEY);

  // Only remind once per day
  if (lastReminder === today) return;

  const settings = getSettings();
  const reminderTime = settings.dailyReminderTime || '10:00';

  // Trigger at user-configured time or later
  if (isTimeReached(reminderTime)) {
    const todayEntries = getEntries().filter(e => e.date === today);
    if (todayEntries.length === 0) {
      const notification: AppNotification = {
        id: generateId(),
        type: 'warning',
        title: '⏰ Daily Entry Reminder',
        message: `It's past ${reminderTime} — don't forget to log your daily entry!`,
        timestamp: Date.now(),
        whatsappAction: sendDailyReminderToWhatsApp,
      };
      addNotification(notification);
      sendBrowserNotification('Daily Entry Reminder', `It's past ${reminderTime} — log your daily entry!`);
      setLastReminderDate(ENTRY_REMINDER_KEY, today);
    }
  }
}

// Check for overdue tasks at user-set time
function checkOverdueTasks(addNotification: AddNotification): void {
  const today = todayStr();
  const lastReminder = getLastReminderDate(REMINDER_KEY);

  // Only remind once per day
  if (lastReminder === today) return;

  const settings = getSettings();
  const overdueTime = settings.overdueReminderTime || '09:00';

  // Trigger at user-configured time or later
  if (!isTimeReached(overdueTime)) return;

  const overdue = getOverdueTasks();
  if (overdue.length > 0) {
    const notification: AppNotification = {
      id: generateId(),
      type: 'error',
      title: '⚠️ Overdue Tasks',
      message: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} that need${overdue.length === 1 ? 's' : ''} attention!`,
      timestamp: Date.now(),
      whatsappAction: sendOverdueToWhatsApp,
    };
    addNotification(notification);
    sendBrowserNotification('Overdue Tasks', `You have ${overdue.length} overdue task(s)!`);
    setLastReminderDate(REMINDER_KEY, today);
  }
}

// Start the reminder system — call this on app mount
export function startReminderSystem(addNotification: AddNotification): () => void {
  // Request permission on first load
  requestNotificationPermission();

  // Run checks immediately
  checkDailyEntryReminder(addNotification);
  checkOverdueTasks(addNotification);

  // Check every 60 seconds
  const interval = setInterval(() => {
    checkDailyEntryReminder(addNotification);
    checkOverdueTasks(addNotification);
  }, 60000);

  return () => clearInterval(interval);
}
