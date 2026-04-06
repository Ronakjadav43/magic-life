// Database-backed data store via API for the Personal Ops System
import { DailyEntry, Project, Lead, Task, UserSettings, StaffMember } from './types';

// --- Daily Entries ---
export async function getEntries(): Promise<DailyEntry[]> {
  try {
    const res = await fetch('/api/entries');
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function addEntry(entry: Omit<DailyEntry, 'id'>): Promise<DailyEntry> {
  const res = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  return await res.json();
}

export async function updateEntry(id: string, data: Partial<DailyEntry>): Promise<void> {
  await fetch(`/api/entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteEntry(id: string): Promise<void> {
  await fetch(`/api/entries/${id}`, { method: 'DELETE' });
}

// --- Projects ---
export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function addProject(project: Omit<Project, 'id'>): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  return await res.json();
}

export async function updateProject(id: string, data: Partial<Project>): Promise<void> {
  await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await fetch(`/api/projects/${id}`, { method: 'DELETE' });
}

// --- Leads ---
export async function getLeads(): Promise<Lead[]> {
  try {
    const res = await fetch('/api/leads');
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function addLead(lead: Omit<Lead, 'id'>): Promise<Lead> {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  return await res.json();
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<void> {
  await fetch(`/api/leads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteLead(id: string): Promise<void> {
  await fetch(`/api/leads/${id}`, { method: 'DELETE' });
}

// --- Tasks ---
export async function getTasks(): Promise<Task[]> {
  try {
    const res = await fetch('/api/tasks');
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return await res.json();
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
}

export async function getOverdueTasks(): Promise<Task[]> {
  const tasks = await getTasks();
  const today = todayStr();
  return tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today);
}

export async function getTaskActivities(taskId: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/tasks/${taskId}/activities`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function getTaskComments(taskId: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/tasks/${taskId}/comments`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function addTaskComment(taskId: string, userId: string, comment: string): Promise<any> {
  const res = await fetch(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, comment }),
  });
  return await res.json();
}


// --- KPI Calculations ---
export function calcHoursPerDay(entries: DailyEntry[], days: number): number {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 86400000);
  const filtered = entries.filter(e => new Date(e.date) >= cutoff);
  if (days === 0) return 0;
  return Math.round((filtered.reduce((s, e) => s + e.timeSpent, 0) / days) * 10) / 10;
}

export function calcConsistency(entries: DailyEntry[], days: number): number {
  const now = new Date();
  const uniqueDays = new Set<string>();
  entries.forEach(e => {
    const d = new Date(e.date);
    const cutoff = new Date(now.getTime() - days * 86400000);
    if (d >= cutoff) uniqueDays.add(e.date);
  });
  return days > 0 ? Math.round((uniqueDays.size / days) * 100) : 0;
}

export function calcConversionRate(leads: Lead[]): number {
  if (leads.length === 0) return 0;
  const closed = leads.filter(l => l.status === 'Closed').length;
  return Math.round((closed / leads.length) * 100);
}

export function calcWeeklyRevenue(leads: Lead[]): number {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  return leads
    .filter(l => l.status === 'Closed' && new Date(l.date) >= weekAgo)
    .reduce((s, l) => s + l.dealValue, 0);
}

export function calcProjectRevenue(projects: Project[]): number {
  return projects.reduce((s, p) => s + p.revenue, 0);
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// --- Search utility ---
export async function globalSearch(query: string): Promise<{
  entries: DailyEntry[];
  projects: Project[];
  leads: Lead[];
  tasks: Task[];
}> {
  const q = query.toLowerCase().trim();
  if (!q) return { entries: [], projects: [], leads: [], tasks: [] };

  const [entries, projects, leads, tasks] = await Promise.all([
    getEntries(), getProjects(), getLeads(), getTasks(),
  ]);

  return {
    entries: entries.filter(e => e.taskName.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q)),
    projects: projects.filter(p => p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)),
    leads: leads.filter(l => l.clientName.toLowerCase().includes(q)),
    tasks: tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
  };
}

// --- Settings ---
const DEFAULT_SETTINGS: UserSettings = {
  dailyReminderTime: '10:00',
  overdueReminderTime: '09:00',
  whatsappNumber: '919723242591',
};

export async function getSettings(userId?: string): Promise<UserSettings> {
  if (!userId) return DEFAULT_SETTINGS;
  try {
    const res = await fetch(`/api/settings?userId=${userId}`);
    if (!res.ok) return DEFAULT_SETTINGS;
    const data = await res.json();
    return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<UserSettings> & { userId: string }): Promise<void> {
  await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
}

// --- Staff ---
export async function getStaff(): Promise<StaffMember[]> {
  try {
    const res = await fetch('/api/staff');
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function getActiveStaff(): Promise<StaffMember[]> {
  const staff = await getStaff();
  return staff.filter(s => s.active);
}

export async function addStaff(data: Omit<StaffMember, 'id' | 'createdAt' | 'initials' | 'color'> & { password?: string }): Promise<StaffMember> {
  const res = await fetch('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function updateStaff(id: string, data: Partial<StaffMember>): Promise<void> {
  await fetch(`/api/staff/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteStaff(id: string): Promise<void> {
  await fetch(`/api/staff/${id}`, { method: 'DELETE' });
}

export async function getStaffById(id: string): Promise<StaffMember | undefined> {
  const staff = await getStaff();
  return staff.find(s => s.id === id);
}

// --- Approval Helpers ---
export async function getPendingApprovals(): Promise<{ tasks: Task[]; entries: DailyEntry[] }> {
  const [tasks, entries] = await Promise.all([getTasks(), getEntries()]);
  return {
    tasks: tasks.filter(t => t.status === 'review'),
    entries: entries.filter(e => e.approval === 'Pending Review'),
  };
}
