// Type definitions for the Personal Ops System

export type Category = 'Learning' | 'Freelance' | 'Health' | 'Personal';
export type EntryStatus = 'Done' | 'Pending';
export type ProjectStatus = 'Active' | 'Completed' | 'On Hold';
export type LeadStatus = 'New' | 'Contacted' | 'Replied' | 'Closed';
export type LeadPlatform = 'LinkedIn' | 'Upwork' | 'Direct' | 'Other';

export interface DailyEntry {
  id: string;
  date: string;
  taskName: string;
  category: Category;
  projectId: string | null;
  timeSpent: number; // hours
  status: EntryStatus;
  notes: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  progress: number; // 0-100
  revenue: number;
}

export interface Lead {
  id: string;
  date: string;
  clientName: string;
  platform: LeadPlatform;
  proposalSent: boolean;
  followUpDate: string;
  status: LeadStatus;
  dealValue: number;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  projectId: string | null;
  status: TaskStatus;
  createdAt: string;
}

export interface KPIData {
  hoursPerDay: number;
  tasksCompleted: number;
  consistencyScore: number;
  leadsGenerated: number;
  conversionRate: number;
  revenueWeek: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  whatsappAction?: () => void;
}

export interface UserSettings {
  dailyReminderTime: string; // HH:MM format e.g. "10:00"
  overdueReminderTime: string; // HH:MM format
  whatsappNumber: string;
}

