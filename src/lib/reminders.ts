// Reminder system for the Personal Ops System
import { getEntries, getOverdueTasks, todayStr, generateId } from './store';
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

// Check if it's 10:00 AM or later and no entry logged today
function checkDailyEntryReminder(addNotification: AddNotification): void {
  const today = todayStr();
  const lastReminder = getLastReminderDate(ENTRY_REMINDER_KEY);

  // Only remind once per day
  if (lastReminder === today) return;

  const now = new Date();
  const hour = now.getHours();

  // Trigger at 10 AM or later
  if (hour >= 10) {
    const todayEntries = getEntries().filter(e => e.date === today);
    if (todayEntries.length === 0) {
      const notification: AppNotification = {
        id: generateId(),
        type: 'warning',
        title: '⏰ Daily Entry Reminder',
        message: "Don't forget to log your daily entry! Track what you're working on today.",
        timestamp: Date.now(),
      };
      addNotification(notification);
      sendBrowserNotification('Daily Entry Reminder', "Don't forget to log your daily entry!");
      setLastReminderDate(ENTRY_REMINDER_KEY, today);
    }
  }
}

// Check for overdue tasks
function checkOverdueTasks(addNotification: AddNotification): void {
  const today = todayStr();
  const lastReminder = getLastReminderDate(REMINDER_KEY);

  // Only remind once per day
  if (lastReminder === today) return;

  const overdue = getOverdueTasks();
  if (overdue.length > 0) {
    const notification: AppNotification = {
      id: generateId(),
      type: 'error',
      title: '⚠️ Overdue Tasks',
      message: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} that need${overdue.length === 1 ? 's' : ''} attention!`,
      timestamp: Date.now(),
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
