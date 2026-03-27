'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import Modal from '@/components/Modal';
import {
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  getProjects,
  todayStr,
} from '@/lib/store';
import type { DailyEntry, Category, EntryStatus, Project } from '@/lib/types';

const CATEGORIES: Category[] = ['Learning', 'Freelance', 'Health', 'Personal'];
const STATUSES: EntryStatus[] = ['Done', 'Pending'];

const defaultForm = {
  date: todayStr(),
  taskName: '',
  category: 'Freelance' as Category,
  projectId: null as string | null,
  timeSpent: 1,
  status: 'Done' as EntryStatus,
  notes: '',
};

export default function DailyEntryPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [mounted, setMounted] = useState(false);

  const reload = useCallback(() => {
    setEntries(getEntries());
    setProjects(getProjects());
  }, []);

  useEffect(() => {
    reload();
    setMounted(true);
  }, [reload]);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  const filtered = filter === 'All' ? entries : entries.filter(e => e.category === filter);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...defaultForm, date: todayStr() });
    setShowModal(true);
  };

  const openEdit = (entry: DailyEntry) => {
    setEditId(entry.id);
    setForm({
      date: entry.date,
      taskName: entry.taskName,
      category: entry.category,
      projectId: entry.projectId,
      timeSpent: entry.timeSpent,
      status: entry.status,
      notes: entry.notes,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.taskName.trim()) return;
    if (editId) {
      updateEntry(editId, form);
    } else {
      addEntry(form);
    }
    setShowModal(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    reload();
  };

  const handleToggleStatus = (entry: DailyEntry) => {
    updateEntry(entry.id, { status: entry.status === 'Done' ? 'Pending' : 'Done' });
    reload();
  };

  return (
    <div className="page fade-in">
      <h1 className="page-title">Daily Entry</h1>
      <p className="page-subtitle">Track what you actually do every day — this is your core engine</p>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="category-pills">
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                className={`category-pill ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> New Entry
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="chart-card">
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={28} /></div>
            <h3>No entries yet</h3>
            <p>Start tracking your daily work to build momentum</p>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add First Entry
            </button>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Category</th>
                <th>Project</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => {
                const proj = entry.projectId
                  ? projects.find(p => p.id === entry.projectId)
                  : null;
                return (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td style={{ fontWeight: 500 }}>{entry.taskName}</td>
                    <td>
                      <span className={`badge badge-${entry.category.toLowerCase() === 'freelance' ? 'active' : entry.category.toLowerCase() === 'learning' ? 'new' : entry.category.toLowerCase() === 'health' ? 'completed' : 'pending'}`}>
                        {entry.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {proj ? proj.name : '—'}
                    </td>
                    <td>{entry.timeSpent}h</td>
                    <td>
                      <button
                        className={`badge badge-${entry.status.toLowerCase()}`}
                        onClick={() => handleToggleStatus(entry)}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {entry.status}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(entry)}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(entry.id)} style={{ color: 'var(--accent-rose)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal
          title={editId ? 'Edit Entry' : 'New Daily Entry'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
        >
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                className="form-control"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Time Spent (hours)</label>
              <input
                type="number"
                className="form-control"
                min={0.5}
                step={0.5}
                value={form.timeSpent}
                onChange={e => setForm({ ...form, timeSpent: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Task Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="What did you work on?"
              value={form.taskName}
              onChange={e => setForm({ ...form, taskName: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as Category })}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as EntryStatus })}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Linked Project</label>
            <select
              className="form-control"
              value={form.projectId || ''}
              onChange={e => setForm({ ...form, projectId: e.target.value || null })}
            >
              <option value="">None</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Any notes..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
