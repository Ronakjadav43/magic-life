'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ListTodo,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Search,
} from 'lucide-react';
import Modal from '@/components/Modal';
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getProjects,
  todayStr,
} from '@/lib/store';
import type { Task, TaskPriority, TaskStatus, Project } from '@/lib/types';

const STATUS_COLS: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const defaultForm = {
  title: '',
  description: '',
  priority: 'Medium' as TaskPriority,
  dueDate: '',
  projectId: null as string | null,
  status: 'To Do' as TaskStatus,
};

const priorityColor: Record<TaskPriority, string> = {
  Low: 'badge-completed',
  Medium: 'badge-active',
  High: 'badge-pending',
  Urgent: 'badge-overdue',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  const reload = useCallback(() => {
    setTasks(getTasks());
    setProjects(getProjects());
  }, []);

  useEffect(() => {
    reload();
    setMounted(true);
  }, [reload]);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  const today = todayStr();

  const filteredTasks = searchQuery
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks;

  const openAdd = (status: TaskStatus = 'To Do') => {
    setEditId(null);
    setForm({ ...defaultForm, status });
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      projectId: task.projectId,
      status: task.status,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editId) {
      updateTask(editId, form);
    } else {
      addTask(form);
    }
    setShowModal(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    reload();
  };

  const moveToNext = (task: Task) => {
    const idx = STATUS_COLS.indexOf(task.status);
    if (idx < STATUS_COLS.length - 1) {
      updateTask(task.id, { status: STATUS_COLS[idx + 1] });
      reload();
    }
  };

  const isOverdue = (task: Task) => task.status !== 'Done' && task.dueDate && task.dueDate < today;

  const overdueCount = tasks.filter(t => isOverdue(t)).length;

  return (
    <div className="page fade-in">
      <h1 className="page-title">Tasks</h1>
      <p className="page-subtitle">Manage your to-dos with priorities and deadlines</p>

      {/* Stats & Search */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {overdueCount > 0 && (
            <div className="overdue-badge">
              <AlertTriangle size={14} /> {overdueCount} overdue
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => openAdd('To Do')}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Kanban Board */}
      {tasks.length === 0 && !searchQuery ? (
        <div className="chart-card">
          <div className="empty-state">
            <div className="empty-state-icon"><ListTodo size={28} /></div>
            <h3>No tasks yet</h3>
            <p>Create your first task to start managing your work</p>
            <button className="btn btn-primary" onClick={() => openAdd('To Do')}>
              <Plus size={16} /> Add First Task
            </button>
          </div>
        </div>
      ) : (
        <div className="kanban-board">
          {STATUS_COLS.map(status => {
            const colTasks = filteredTasks.filter(t => t.status === status);
            return (
              <div key={status} className="kanban-col">
                <div className="kanban-col-header">
                  <span className="kanban-col-title">
                    {status === 'To Do' && '📋'} {status === 'In Progress' && '🔄'} {status === 'Done' && '✅'} {status}
                  </span>
                  <span className="pipeline-col-count">{colTasks.length}</span>
                </div>

                {/* Quick add for To Do */}
                {status === 'To Do' && (
                  <button
                    className="kanban-quick-add"
                    onClick={() => openAdd('To Do')}
                  >
                    <Plus size={14} /> Add task
                  </button>
                )}

                {colTasks.map(task => {
                  const proj = task.projectId ? projects.find(p => p.id === task.projectId) : null;
                  const overdue = isOverdue(task);
                  return (
                    <div
                      key={task.id}
                      className={`kanban-card ${overdue ? 'kanban-card-overdue' : ''}`}
                      onClick={() => openEdit(task)}
                    >
                      <div className="kanban-card-top">
                        <span className={`badge ${priorityColor[task.priority]}`}>
                          {task.priority}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {status !== 'Done' && (
                            <button
                              className="btn-icon"
                              style={{ padding: 4, border: 'none' }}
                              onClick={e => { e.stopPropagation(); moveToNext(task); }}
                              title="Move to next stage"
                            >
                              <ArrowRight size={14} />
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            style={{ padding: 4, border: 'none', color: 'var(--accent-rose)' }}
                            onClick={e => { e.stopPropagation(); handleDelete(task.id); }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h4 className="kanban-card-title">{task.title}</h4>
                      {task.description && (
                        <p className="kanban-card-desc">{task.description}</p>
                      )}
                      <div className="kanban-card-meta">
                        {task.dueDate && (
                          <span className={overdue ? 'kanban-meta-overdue' : ''}>
                            <Calendar size={12} /> {task.dueDate}
                          </span>
                        )}
                        {proj && <span>📁 {proj.name}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal
          title={editId ? 'Edit Task' : 'New Task'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
        >
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="Task title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Optional details..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                className="form-control"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })}
              >
                {STATUS_COLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                className="form-control"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
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
          </div>
        </Modal>
      )}
    </div>
  );
}
