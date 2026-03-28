// LocalStorage-based data store for the Personal Ops System
import { DailyEntry, Project, Lead, Task, UserSettings, StaffMember } from './types';

const KEYS = {
  entries: 'ops_daily_entries',
  projects: 'ops_projects',
  leads: 'ops_leads',
  tasks: 'ops_tasks',
  staff: 'ops_staff',
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// --- Generic CRUD ---
function getAll<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveAll<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
}

// --- Daily Entries ---
export function getEntries(): DailyEntry[] {
  return getAll<DailyEntry>(KEYS.entries);
}
export function addEntry(entry: Omit<DailyEntry, 'id'>): DailyEntry {
  const items = getEntries();
  const newItem = { ...entry, id: generateId() };
  items.unshift(newItem);
  saveAll(KEYS.entries, items);
  return newItem;
}
export function updateEntry(id: string, data: Partial<DailyEntry>): void {
  const items = getEntries().map(e => (e.id === id ? { ...e, ...data } : e));
  saveAll(KEYS.entries, items);
}
export function deleteEntry(id: string): void {
  saveAll(KEYS.entries, getEntries().filter(e => e.id !== id));
}

// --- Projects ---
export function getProjects(): Project[] {
  return getAll<Project>(KEYS.projects);
}
export function addProject(project: Omit<Project, 'id'>): Project {
  const items = getProjects();
  const newItem = { ...project, id: generateId() };
  items.unshift(newItem);
  saveAll(KEYS.projects, items);
  return newItem;
}
export function updateProject(id: string, data: Partial<Project>): void {
  const items = getProjects().map(p => (p.id === id ? { ...p, ...data } : p));
  saveAll(KEYS.projects, items);
}
export function deleteProject(id: string): void {
  saveAll(KEYS.projects, getProjects().filter(p => p.id !== id));
}

// --- Leads ---
export function getLeads(): Lead[] {
  return getAll<Lead>(KEYS.leads);
}
export function addLead(lead: Omit<Lead, 'id'>): Lead {
  const items = getLeads();
  const newItem = { ...lead, id: generateId() };
  items.unshift(newItem);
  saveAll(KEYS.leads, items);
  return newItem;
}
export function updateLead(id: string, data: Partial<Lead>): void {
  const items = getLeads().map(l => (l.id === id ? { ...l, ...data } : l));
  saveAll(KEYS.leads, items);
}
export function deleteLead(id: string): void {
  saveAll(KEYS.leads, getLeads().filter(l => l.id !== id));
}

// --- Tasks ---
export function getTasks(): Task[] {
  return getAll<Task>(KEYS.tasks);
}
export function addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
  const items = getTasks();
  const newItem = { ...task, id: generateId(), createdAt: new Date().toISOString() };
  items.unshift(newItem);
  saveAll(KEYS.tasks, items);
  return newItem;
}
export function updateTask(id: string, data: Partial<Task>): void {
  const items = getTasks().map(t => (t.id === id ? { ...t, ...data } : t));
  saveAll(KEYS.tasks, items);
}
export function deleteTask(id: string): void {
  saveAll(KEYS.tasks, getTasks().filter(t => t.id !== id));
}
export function getOverdueTasks(): Task[] {
  const today = todayStr();
  return getTasks().filter(t => t.status !== 'Done' && t.dueDate && t.dueDate < today);
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
export function globalSearch(query: string): {
  entries: DailyEntry[];
  projects: Project[];
  leads: Lead[];
  tasks: Task[];
} {
  const q = query.toLowerCase().trim();
  if (!q) return { entries: [], projects: [], leads: [], tasks: [] };
  return {
    entries: getEntries().filter(e => e.taskName.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q)),
    projects: getProjects().filter(p => p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)),
    leads: getLeads().filter(l => l.clientName.toLowerCase().includes(q)),
    tasks: getTasks().filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
  };
}

// --- Settings ---
const SETTINGS_KEY = 'ops_settings';

const DEFAULT_SETTINGS: UserSettings = {
  dailyReminderTime: '10:00',
  overdueReminderTime: '09:00',
  whatsappNumber: '919723242591',
};

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<UserSettings>): void {
  if (typeof window === 'undefined') return;
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

// --- Staff ---
const STAFF_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#0ea5e9',
];

function pickColor(): string {
  return STAFF_COLORS[Math.floor(Math.random() * STAFF_COLORS.length)];
}

function makeInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function getStaff(): StaffMember[] {
  return getAll<StaffMember>(KEYS.staff);
}

export function getActiveStaff(): StaffMember[] {
  return getStaff().filter(s => s.active);
}

export function addStaff(data: Omit<StaffMember, 'id' | 'createdAt' | 'initials' | 'color'>): StaffMember {
  const items = getStaff();
  const newItem: StaffMember = {
    ...data,
    id: generateId(),
    initials: makeInitials(data.name),
    color: pickColor(),
    createdAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  saveAll(KEYS.staff, items);
  return newItem;
}

export function updateStaff(id: string, data: Partial<StaffMember>): void {
  const items = getStaff().map(s => {
    if (s.id !== id) return s;
    const updated = { ...s, ...data };
    if (data.name) updated.initials = makeInitials(data.name);
    return updated;
  });
  saveAll(KEYS.staff, items);
}

export function deleteStaff(id: string): void {
  saveAll(KEYS.staff, getStaff().filter(s => s.id !== id));
}

export function getStaffById(id: string): StaffMember | undefined {
  return getStaff().find(s => s.id === id);
}

// --- Approval Helpers ---
export function getPendingApprovals(): { tasks: Task[]; entries: DailyEntry[] } {
  return {
    tasks: getTasks().filter(t => t.approval === 'Pending Review'),
    entries: getEntries().filter(e => e.approval === 'Pending Review'),
  };
}
