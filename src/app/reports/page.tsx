'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Printer,
  Clock,
  CheckCircle2,
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  getEntries,
  getLeads,
  getProjects,
  getTasks,
  calcProjectRevenue,
} from '@/lib/store';
import type { DailyEntry, Lead, Project, Task } from '@/lib/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type ReportRange = 'week' | 'month' | 'custom';

function getDateRange(range: ReportRange, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (range === 'week') {
    const from = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    return { from, to };
  }
  if (range === 'month') {
    const from = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    return { from, to };
  }
  return { from: customFrom || to, to: customTo || to };
}

export default function ReportsPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [range, setRange] = useState<ReportRange>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEntries(getEntries());
    setLeads(getLeads());
    setProjects(getProjects());
    setTasks(getTasks());
    setMounted(true);
  }, []);

  const { from, to } = getDateRange(range, customFrom, customTo);

  const filteredEntries = useMemo(() =>
    entries.filter(e => e.date >= from && e.date <= to),
  [entries, from, to]);

  const filteredLeads = useMemo(() =>
    leads.filter(l => l.date >= from && l.date <= to),
  [leads, from, to]);

  const filteredTasks = useMemo(() =>
    tasks.filter(t => t.createdAt.slice(0, 10) >= from && t.createdAt.slice(0, 10) <= to),
  [tasks, from, to]);

  // Stats
  const totalHours = Math.round(filteredEntries.reduce((s, e) => s + e.timeSpent, 0) * 10) / 10;
  const tasksDone = filteredEntries.filter(e => e.status === 'Done').length;
  const entriesLogged = filteredEntries.length;
  const leadsClosed = filteredLeads.filter(l => l.status === 'Closed').length;
  const revenueEarned = filteredLeads.filter(l => l.status === 'Closed').reduce((s, l) => s + l.dealValue, 0)
    + calcProjectRevenue(projects);
  const tasksCompleted = filteredTasks.filter(t => t.status === 'Done').length;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { hours: number; count: number }> = {};
    filteredEntries.forEach(e => {
      if (!map[e.category]) map[e.category] = { hours: 0, count: 0 };
      map[e.category].hours += e.timeSpent;
      map[e.category].count++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, hours: Math.round(d.hours * 10) / 10, count: d.count }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredEntries]);

  // Project hours breakdown
  const projectBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEntries.forEach(e => {
      if (e.projectId) {
        const proj = projects.find(p => p.id === e.projectId);
        const name = proj ? proj.name : 'Unknown';
        map[name] = (map[name] || 0) + e.timeSpent;
      }
    });
    return Object.entries(map)
      .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredEntries, projects]);

  // Daily hours chart
  const dailyChart = useMemo(() => {
    const d: Record<string, number> = {};
    filteredEntries.forEach(e => {
      d[e.date] = (d[e.date] || 0) + e.timeSpent;
    });
    return Object.entries(d)
      .map(([date, hours]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: Math.round(hours * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEntries]);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  const rangeLabel = range === 'week' ? 'Weekly' : range === 'month' ? 'Monthly' : 'Custom';

  return (
    <div className="page fade-in print-page">
      <div className="toolbar no-print">
        <div>
          <h1 className="page-title">{rangeLabel} Report</h1>
          <p className="page-subtitle">{from} to {to}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="range-selector">
            <button className={`range-btn ${range === 'week' ? 'active' : ''}`} onClick={() => setRange('week')}>Weekly</button>
            <button className={`range-btn ${range === 'month' ? 'active' : ''}`} onClick={() => setRange('month')}>Monthly</button>
            <button className={`range-btn ${range === 'custom' ? 'active' : ''}`} onClick={() => setRange('custom')}>Custom</button>
          </div>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {range === 'custom' && (
        <div className="form-row no-print" style={{ maxWidth: 400, marginBottom: 24 }}>
          <div className="form-group">
            <label>From</label>
            <input type="date" className="form-control" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label>To</label>
            <input type="date" className="form-control" value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </div>
        </div>
      )}

      {/* Print Header */}
      <div className="print-only print-header">
        <h1>Magic Life — {rangeLabel} Report</h1>
        <p>{from} to {to}</p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Hours</span>
            <div className="stat-card-icon blue"><Clock size={20} /></div>
          </div>
          <div className="stat-card-value">{totalHours}</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-label">Entries Logged</span>
            <div className="stat-card-icon emerald"><BookOpen size={20} /></div>
          </div>
          <div className="stat-card-value">{entriesLogged}</div>
          <div className="stat-card-sub">{tasksDone} marked done</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-card-header">
            <span className="stat-card-label">Tasks Done</span>
            <div className="stat-card-icon amber"><CheckCircle2 size={20} /></div>
          </div>
          <div className="stat-card-value">{tasksCompleted}</div>
        </div>
        <div className="stat-card rose">
          <div className="stat-card-header">
            <span className="stat-card-label">Leads Closed</span>
            <div className="stat-card-icon rose"><Users size={20} /></div>
          </div>
          <div className="stat-card-value">{leadsClosed}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Revenue</span>
            <div className="stat-card-icon cyan"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">₹{revenueEarned.toLocaleString()}</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-label">Avg Hours/Day</span>
            <div className="stat-card-icon purple"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-card-value">
            {dailyChart.length > 0 ? (totalHours / dailyChart.length).toFixed(1) : '0'}
          </div>
        </div>
      </div>

      {/* Daily Hours Chart */}
      {dailyChart.length > 0 && (
        <div className="chart-card">
          <h3>Daily Hours</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13 }} />
              <Bar dataKey="hours" fill="url(#reportGrad)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Breakdown Tables */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Category Breakdown</h3>
          {categoryBreakdown.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: 20 }}>No data for this period</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Category</th><th>Hours</th><th>Entries</th></tr>
              </thead>
              <tbody>
                {categoryBreakdown.map(r => (
                  <tr key={r.name}><td>{r.name}</td><td>{r.hours}h</td><td>{r.count}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="chart-card">
          <h3>Project Hours</h3>
          {projectBreakdown.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: 20 }}>No project-linked entries</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Project</th><th>Hours</th></tr>
              </thead>
              <tbody>
                {projectBreakdown.map(r => (
                  <tr key={r.name}><td>{r.name}</td><td>{r.hours}h</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
