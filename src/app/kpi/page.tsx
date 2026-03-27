'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
  Percent,
  DollarSign,
} from 'lucide-react';
import {
  getEntries,
  getLeads,
  getProjects,
  calcHoursPerDay,
  calcConsistency,
  calcConversionRate,
  calcWeeklyRevenue,
  calcProjectRevenue,
} from '@/lib/store';
import type { DailyEntry, Lead, Project } from '@/lib/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: 'All Time', days: 365 },
];

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export default function KPIPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [range, setRange] = useState(30);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEntries(getEntries());
    setLeads(getLeads());
    setProjects(getProjects());
    setMounted(true);
  }, []);

  // Build daily hours chart data
  const hoursChartData = useMemo(() => {
    const now = new Date();
    const data: { date: string; hours: number; tasks: number }[] = [];
    for (let i = Math.min(range, 30) - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayEntries = entries.filter(e => e.date === dateStr);
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: Math.round(dayEntries.reduce((s, e) => s + e.timeSpent, 0) * 10) / 10,
        tasks: dayEntries.filter(e => e.status === 'Done').length,
      });
    }
    return data;
  }, [entries, range]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    const now = new Date();
    const cutoff = new Date(now.getTime() - range * 86400000);
    entries
      .filter(e => new Date(e.date) >= cutoff)
      .forEach(e => {
        counts[e.category] = (counts[e.category] || 0) + 1;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [entries, range]);

  // Lead funnel data
  const leadFunnelData = useMemo(() => {
    const statusCounts = { New: 0, Contacted: 0, Replied: 0, Closed: 0 };
    leads.forEach(l => {
      if (l.status in statusCounts) statusCounts[l.status as keyof typeof statusCounts]++;
    });
    return Object.entries(statusCounts).map(([name, count]) => ({ name, count }));
  }, [leads]);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  const hoursPerDay = calcHoursPerDay(entries, range);
  const tasksCompleted = entries.filter(e => {
    const cutoff = new Date(Date.now() - range * 86400000);
    return e.status === 'Done' && new Date(e.date) >= cutoff;
  }).length;
  const consistency = calcConsistency(entries, range);
  const leadsGenerated = leads.length;
  const conversionRate = calcConversionRate(leads);
  const weeklyRev = calcWeeklyRevenue(leads);
  const totalRev = calcProjectRevenue(projects);

  return (
    <div className="page fade-in">
      <h1 className="page-title">KPI Summary</h1>
      <p className="page-subtitle">Measure your growth — this is your performance brain</p>

      {/* Range Selector */}
      <div className="range-selector">
        {RANGES.map(r => (
          <button
            key={r.days}
            className={`range-btn ${range === r.days ? 'active' : ''}`}
            onClick={() => setRange(r.days)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Hours / Day</span>
            <div className="stat-card-icon blue"><Clock size={20} /></div>
          </div>
          <div className="stat-card-value">{hoursPerDay}</div>
          <div className="stat-card-sub">Average over {range} days</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-label">Tasks Completed</span>
            <div className="stat-card-icon emerald"><CheckCircle2 size={20} /></div>
          </div>
          <div className="stat-card-value">{tasksCompleted}</div>
          <div className="stat-card-sub">In selected period</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-card-header">
            <span className="stat-card-label">Consistency</span>
            <div className="stat-card-icon amber"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-card-value">{consistency}%</div>
          <div className="stat-card-sub">Days active / period</div>
        </div>
        <div className="stat-card rose">
          <div className="stat-card-header">
            <span className="stat-card-label">Leads Generated</span>
            <div className="stat-card-icon rose"><Users size={20} /></div>
          </div>
          <div className="stat-card-value">{leadsGenerated}</div>
          <div className="stat-card-sub">All time</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Conversion Rate</span>
            <div className="stat-card-icon purple"><Percent size={20} /></div>
          </div>
          <div className="stat-card-value">{conversionRate}%</div>
          <div className="stat-card-sub">Closed / Total leads</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Revenue</span>
            <div className="stat-card-icon cyan"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">₹{totalRev.toLocaleString()}</div>
          <div className="stat-card-sub">₹{weeklyRev.toLocaleString()} this week</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Hours per day chart */}
        <div className="chart-card">
          <h3>Daily Hours Worked</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hoursChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                }}
              />
              <Bar dataKey="hours" fill="url(#blueGrad)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks completed line chart */}
        <div className="chart-card">
          <h3>Tasks Completed / Day</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={hoursChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie chart */}
        <div className="chart-card">
          <h3>Work Category Distribution</h3>
          {categoryData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No entries in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Lead Funnel */}
        <div className="chart-card">
          <h3>Lead Pipeline Funnel</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={leadFunnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                }}
              />
              <Bar dataKey="count" fill="url(#purpleGrad)" radius={[0, 4, 4, 0]} />
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
