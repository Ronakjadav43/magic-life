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
  taskId?: string | null;
  linkedTaskIds?: string[];
  task?: Task | null;
  timeSpent: number; // hours
  status: EntryStatus;
  notes: string;
  assigneeId?: string | null;
  approval?: ApprovalStatus;
  approvedBy?: string | null;
  approvalNote?: string;
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
  teamIds?: string[];
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
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export const STATUS = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  DONE: "done"
} as const;

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  projectId: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  assigneeId?: string | null;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  action: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  userId?: string | null;
  timestamp: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  comment: string;
  createdAt: string;
  user?: StaffMember | null; // useful for nested relation
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
  dailyReminderTime: string;
  overdueReminderTime: string;
  whatsappNumber: string;
}

// --- Phase 3: Staff & Approval ---

export type StaffRole = 'Admin' | 'Manager' | 'Staff';
export type ApprovalStatus = 'Pending Review' | 'Approved' | 'Rejected' | 'Not Submitted';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  initials: string;
  color: string; // avatar bg color
  active: boolean;
  createdAt: string;
}

