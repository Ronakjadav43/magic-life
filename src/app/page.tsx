'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  CalendarDays,
  AlertTriangle,
  ListTodo,
} from 'lucide-react';
import { getEntries, getProjects, getLeads, getTasks, getOverdueTasks, calcConsistency, calcProjectRevenue, todayStr } from '@/lib/store';
import type { DailyEntry, Project, Lead, Task } from '@/lib/types';

export default function Dashboard() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [overdue, setOverdue] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEntries(getEntries());
    setProjects(getProjects());
    setLeads(getLeads());
    setTasks(getTasks());
    setOverdue(getOverdueTasks());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  const today = todayStr();
  const todayEntries = entries.filter(e => e.date === today);
  const pendingEntries = entries.filter(e => e.status === 'Pending');
  const activeProjects = projects.filter(p => p.status === 'Active');
  const pipelineLeads = leads.filter(l => l.status !== 'Closed');
  const totalRevenue = calcProjectRevenue(projects);
  const consistency = calcConsistency(entries, 30);
  const activeTasks = tasks.filter(t => t.status !== 'Done');

  // recent activity
  const recentEntries = entries.slice(0, 5);

  const categoryColors: Record<string, string> = {
    Learning: 'purple',
    Freelance: 'blue',
    Health: 'emerald',
    Personal: 'amber',
  };

  return (
    <div className="page fade-in">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Your personal operations at a glance</p>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link href="/daily-entry" className="btn btn-primary">
          <Plus size={16} /> New Entry
        </Link>
        <Link href="/tasks" className="btn btn-secondary">
          <ListTodo size={16} /> Add Task
        </Link>
        <Link href="/leads" className="btn btn-secondary">
          <Users size={16} /> Add Lead
        </Link>
        <Link href="/projects" className="btn btn-secondary">
          <FolderKanban size={16} /> New Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Today&apos;s Tasks</span>
            <div className="stat-card-icon blue"><CheckCircle2 size={20} /></div>
          </div>
          <div className="stat-card-value">{todayEntries.length}</div>
          <div className="stat-card-sub">{todayEntries.filter(e => e.status === 'Done').length} completed</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-card-header">
            <span className="stat-card-label">Pending</span>
            <div className="stat-card-icon amber"><Clock size={20} /></div>
          </div>
          <div className="stat-card-value">{pendingEntries.length}</div>
          <div className="stat-card-sub">Across all days</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-label">Active Projects</span>
            <div className="stat-card-icon emerald"><FolderKanban size={20} /></div>
          </div>
          <div className="stat-card-value">{activeProjects.length}</div>
          <div className="stat-card-sub">{projects.filter(p => p.status === 'Completed').length} completed</div>
        </div>

        <div className="stat-card rose">
          <div className="stat-card-header">
            <span className="stat-card-label">Pipeline Leads</span>
            <div className="stat-card-icon rose"><Users size={20} /></div>
          </div>
          <div className="stat-card-value">{pipelineLeads.length}</div>
          <div className="stat-card-sub">{leads.length} total leads</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Revenue</span>
            <div className="stat-card-icon cyan"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">₹{totalRevenue.toLocaleString()}</div>
          <div className="stat-card-sub">From all projects</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-label">Consistency</span>
            <div className="stat-card-icon purple"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-card-value">{consistency}%</div>
          <div className="stat-card-sub">Last 30 days</div>
        </div>
      </div>

      {/* Overdue Tasks Alert */}
      {overdue.length > 0 && (
        <div className="chart-card" style={{ borderLeft: '3px solid var(--accent-rose)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-rose)' }} />
            Overdue Tasks ({overdue.length})
          </h3>
          <div className="activity-list" style={{ marginTop: 8 }}>
            {overdue.slice(0, 5).map(t => (
              <div key={t.id} className="activity-item">
                <div className="activity-dot" style={{ background: 'var(--accent-rose)' }} />
                <div className="activity-text">
                  <strong>{t.title}</strong>
                  <span style={{ color: 'var(--accent-rose)', marginLeft: 8, fontSize: 12 }}>
                    Due: {t.dueDate} · {t.priority}
                  </span>
                </div>
                <Link href="/tasks" className="btn btn-sm btn-secondary">View</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Tasks Summary */}
      {activeTasks.length > 0 && (
        <div className="chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListTodo size={18} /> Active Tasks ({activeTasks.length})
          </h3>
          <div className="activity-list" style={{ marginTop: 8 }}>
            {activeTasks.slice(0, 5).map(t => (
              <div key={t.id} className="activity-item">
                <div className={`activity-dot ${t.status === 'In Progress' ? 'blue' : 'amber'}`} />
                <div className="activity-text">
                  <strong>{t.title}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
                    {t.status} · {t.priority}
                    {t.dueDate && ` · Due: ${t.dueDate}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="chart-card">
        <h3>Recent Activity</h3>
        {recentEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={28} /></div>
            <h3>No entries yet</h3>
            <p>Start by adding your first daily entry</p>
            <Link href="/daily-entry" className="btn btn-primary">
              <Plus size={16} /> Add Entry
            </Link>
          </div>
        ) : (
          <div className="activity-list">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="activity-item">
                <div className={`activity-dot ${categoryColors[entry.category] || 'blue'}`} />
                <div className="activity-text">
                  <strong>{entry.taskName}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
                    {entry.category} · {entry.timeSpent}h · {entry.status}
                  </span>
                </div>
                <div className="activity-time">{entry.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Projects Overview */}
      {activeProjects.length > 0 && (
        <div className="chart-card">
          <h3>Active Projects</h3>
          <div className="projects-grid" style={{ marginTop: 8 }}>
            {activeProjects.slice(0, 4).map(p => (
              <div key={p.id} className="project-card" style={{ background: 'var(--bg-primary)' }}>
                <h3 style={{ fontSize: 14, marginBottom: 4 }}>{p.name}</h3>
                <div className="project-card-client">{p.clientName}</div>
                <div className="project-card-progress" style={{ marginTop: 12 }}>
                  <div className="project-card-progress-label">
                    <span>Progress</span><span>{p.progress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
