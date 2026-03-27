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

export interface KPIData {
  hoursPerDay: number;
  tasksCompleted: number;
  consistencyScore: number;
  leadsGenerated: number;
  conversionRate: number;
  revenueWeek: number;
}
