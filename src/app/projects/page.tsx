'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  Calendar,
  DollarSign,
  Search,
} from 'lucide-react';
import Modal from '@/components/Modal';
import {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  todayStr,
} from '@/lib/store';
import type { Project, ProjectStatus } from '@/lib/types';

const STATUS_LIST: ProjectStatus[] = ['Active', 'Completed', 'On Hold'];

const defaultForm = {
  name: '',
  clientName: '',
  startDate: todayStr(),
  deadline: '',
  status: 'Active' as ProjectStatus,
  progress: 0,
  revenue: 0,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [mounted, setMounted] = useState(false);

  const reload = useCallback(() => setProjects(getProjects()), []);

  useEffect(() => {
    reload();
    setMounted(true);
  }, [reload]);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  let filtered = statusFilter === 'All' ? projects : projects.filter(p => p.status === statusFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q));
  }

  const openAdd = () => {
    setEditId(null);
    setForm({ ...defaultForm, startDate: todayStr() });
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      clientName: p.clientName,
      startDate: p.startDate,
      deadline: p.deadline,
      status: p.status,
      progress: p.progress,
      revenue: p.revenue,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      updateProject(editId, form);
    } else {
      addProject(form);
    }
    setShowModal(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    reload();
  };

  const statusBadge = (status: ProjectStatus) => {
    const cls = status === 'Active' ? 'active' : status === 'Completed' ? 'completed' : 'onhold';
    return <span className={`badge badge-${cls}`}>{status}</span>;
  };

  return (
    <div className="page fade-in">
      <h1 className="page-title">Projects</h1>
      <p className="page-subtitle">Track all ongoing &amp; completed work</p>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="category-pills" style={{ marginBottom: 0 }}>
            {['All', ...STATUS_LIST].map(s => (
              <button
                key={s}
                className={`category-pill ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="chart-card">
          <div className="empty-state">
            <div className="empty-state-icon"><FolderKanban size={28} /></div>
            <h3>No projects yet</h3>
            <p>Create your first project to start tracking execution</p>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add Project
            </button>
          </div>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(p => (
            <div key={p.id} className="project-card">
              <div className="project-card-header">
                <div>
                  <h3>{p.name}</h3>
                  <div className="project-card-client">{p.clientName}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-icon" onClick={() => openEdit(p)}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(p.id)} style={{ color: 'var(--accent-rose)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {statusBadge(p.status)}
              <div className="project-card-meta">
                <span><Calendar size={14} /> {p.startDate}</span>
                {p.deadline && <span>📅 Due: {p.deadline}</span>}
              </div>
              <div className="project-card-progress">
                <div className="project-card-progress-label">
                  <span>Progress</span><span>{p.progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <div className="project-card-revenue">
                <span className="project-card-revenue-label">Revenue</span>
                <span className="project-card-revenue-value">
                  <DollarSign size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  ₹{p.revenue.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editId ? 'Edit Project' : 'New Project'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
        >
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Project name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Client Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Client name"
              value={form.clientName}
              onChange={e => setForm({ ...form, clientName: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                className="form-control"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                className="form-control"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as ProjectStatus })}
              >
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Progress %</label>
              <input
                type="number"
                className="form-control"
                min={0}
                max={100}
                value={form.progress}
                onChange={e => setForm({ ...form, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Revenue (₹)</label>
            <input
              type="number"
              className="form-control"
              min={0}
              value={form.revenue}
              onChange={e => setForm({ ...form, revenue: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
