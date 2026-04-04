// WhatsApp integration for task reminders
import { getTasks, getOverdueTasks, getEntries, todayStr, getSettings } from './store';
import type { Task } from './types';

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
const DEFAULT_NUMBER = '919723242591';

// Generate WhatsApp URL with pre-filled message (needs number passed in)
function whatsappUrlWithNumber(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// Send a single task to WhatsApp
export async function sendTaskToWhatsApp(task: Task): Promise<void> {
  const settings = await getSettings();
  const number = settings.whatsappNumber || DEFAULT_NUMBER;

  const lines = [
    `📋 *Task: ${task.title}*`,
    '',
    task.description ? `📝 ${task.description}` : '',
    `🔴 Priority: ${task.priority}`,
    `📊 Status: ${task.status}`,
    task.dueDate ? `📅 Due: ${task.dueDate}` : '',
    '',
    `🔗 Open Tasks: ${APP_URL}/tasks`,
  ].filter(Boolean).join('\n');

  window.open(whatsappUrlWithNumber(number, lines), '_blank');
}

// Send overdue tasks summary to WhatsApp
export async function sendOverdueToWhatsApp(): Promise<void> {
  const overdue = await getOverdueTasks();
  if (overdue.length === 0) return;

  const settings = await getSettings();
  const number = settings.whatsappNumber || DEFAULT_NUMBER;

  const taskLines = overdue.map((t, i) =>
    `${i + 1}. *${t.title}* — Due: ${t.dueDate} (${t.priority})`
  ).join('\n');

  const message = [
    `⚠️ *Overdue Tasks Alert*`,
    `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}:`,
    '',
    taskLines,
    '',
    `🔗 View Tasks: ${APP_URL}/tasks`,
  ].join('\n');

  window.open(whatsappUrlWithNumber(number, message), '_blank');
}

// Send daily entry reminder to WhatsApp
export async function sendDailyReminderToWhatsApp(): Promise<void> {
  const today = todayStr();
  const entries = await getEntries();
  const todayEntries = entries.filter(e => e.date === today);

  const settings = await getSettings();
  const number = settings.whatsappNumber || DEFAULT_NUMBER;

  const message = todayEntries.length === 0
    ? [
      `⏰ *Daily Entry Reminder*`,
      '',
      `Hey! You haven't logged any work today (${today}).`,
      `Don't forget to track your progress!`,
      '',
      `🔗 Log Entry: ${APP_URL}/daily-entry`,
    ].join('\n')
    : [
      `✅ *Daily Summary — ${today}*`,
      '',
      `You've logged ${todayEntries.length} ${todayEntries.length === 1 ? 'entry' : 'entries'} today:`,
      '',
      ...todayEntries.map((e, i) =>
        `${i + 1}. *${e.taskName}* — ${e.category} · ${e.timeSpent}h · ${e.status}`
      ),
      '',
      `🔗 View Entries: ${APP_URL}/daily-entry`,
    ].join('\n');

  window.open(whatsappUrlWithNumber(number, message), '_blank');
}

// Send full daily task summary (all active tasks) to WhatsApp
export async function sendTaskSummaryToWhatsApp(): Promise<void> {
  const tasks = await getTasks();
  const todo = tasks.filter(t => t.status === 'To Do');
  const inProgress = tasks.filter(t => t.status === 'In Progress');
  const done = tasks.filter(t => t.status === 'Done');
  const overdue = await getOverdueTasks();
  const today = todayStr();

  const settings = await getSettings();
  const number = settings.whatsappNumber || DEFAULT_NUMBER;

  const formatList = (list: Task[]) =>
    list.length === 0
      ? '  _None_'
      : list.map((t, i) =>
        `  ${i + 1}. *${t.title}*${t.dueDate ? ` (Due: ${t.dueDate})` : ''} — ${t.priority}`
      ).join('\n');

  const message = [
    `📊 *Task Summary — ${today}*`,
    '',
    overdue.length > 0 ? `🔴 *Overdue: ${overdue.length}*` : '',
    '',
    `📋 *To Do (${todo.length}):*`,
    formatList(todo),
    '',
    `🔄 *In Progress (${inProgress.length}):*`,
    formatList(inProgress),
    '',
    `✅ *Done (${done.length}):*`,
    formatList(done),
    '',
    `🔗 Manage Tasks: ${APP_URL}/tasks`,
  ].filter(Boolean).join('\n');

  window.open(whatsappUrlWithNumber(number, message), '_blank');
}
