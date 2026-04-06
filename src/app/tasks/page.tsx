'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, ListTodo, Calendar, Search, MessageCircle, Send,
  User, CheckCircle2, Clock, History, AlertTriangle
} from 'lucide-react';
import Modal from '@/components/Modal';
import {
  getTasks, addTask, updateTask, deleteTask,
  getProjects, getActiveStaff, todayStr,
  getTaskComments, getTaskActivities, addTaskComment
} from '@/lib/store';
import { sendTaskSummaryToWhatsApp, sendOverdueToWhatsApp } from '@/lib/whatsapp';
import type { Task, TaskPriority, TaskStatus, Project, StaffMember, Comment, TaskActivity } from '@/lib/types';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const STATUS_COLS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const statusLabels: Record<TaskStatus, { label: string; icon: string }> = {
  backlog: { label: 'Backlog', icon: '📝' },
  todo: { label: 'To Do', icon: '📋' },
  in_progress: { label: 'In Progress', icon: '🔄' },
  review: { label: 'Review', icon: '👀' },
  done: { label: 'Done', icon: '✅' },
};

const priorityColor: Record<TaskPriority, string> = {
  Low: 'badge-completed',
  Medium: 'badge-active',
  High: 'badge-pending',
  Urgent: 'badge-overdue',
};

const defaultForm = {
  title: '',
  description: '',
  priority: 'Medium' as TaskPriority,
  dueDate: '',
  projectId: null as string | null,
  status: 'backlog' as TaskStatus,
  assigneeId: null as string | null,
};

// Sub-component for Draggable Card
function KanbanTaskCard({ task, onClick, children }: { task: Task, onClick: () => void, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : 1,
    position: 'relative' as any,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`kanban-card ${task.status !== 'done' && task.dueDate && task.dueDate < todayStr() ? 'kanban-card-overdue' : ''}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {children}
    </div>
  );
}

// Sub-component for Droppable Column
function KanbanColumn({ status, children }: { status: TaskStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-col ${isOver ? 'kanban-col-over' : ''}`}
      style={{ transition: 'background-color 0.2s', backgroundColor: isOver ? 'var(--bg-secondary)' : undefined }}
    >
      <div className="kanban-col-header">
        <span className="kanban-col-title">
          {statusLabels[status].icon} {statusLabels[status].label}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);

  const [mounted, setMounted] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const reload = useCallback(async () => {
    const [t, p, s] = await Promise.all([getTasks(), getProjects(), getActiveStaff()]);
    setTasks(t);
    setProjects(p);
    setStaffList(s);
    if (s.length > 0) setCurrentUser(s[0]); // fallback user for demo
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

  const openAdd = (status: TaskStatus = 'backlog') => {
    setEditId(null);
    setForm({ ...defaultForm, status });
    setComments([]);
    setActivities([]);
    setShowModal(true);
  };

  const openEdit = async (task: Task) => {
    setEditId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      projectId: task.projectId,
      status: task.status,
      assigneeId: task.assigneeId || null,
    });
    setShowModal(true);
    
    // Fetch related records
    const [c, a] = await Promise.all([getTaskComments(task.id), getTaskActivities(task.id)]);
    setComments(c);
    setActivities(a);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (editId) {
      await updateTask(editId, form);
    } else {
      await addTask(form);
    }
    setShowModal(false);
    await reload();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    setShowModal(false);
    await reload();
  };

  const handlePostComment = async () => {
    if (!editId || !newComment.trim() || !currentUser) return;
    await addTaskComment(editId, currentUser.id, newComment);
    setNewComment('');
    const c = await getTaskComments(editId);
    setComments(c);
  };

  const overdueCount = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today).length;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== newStatus) {
      // Optimistic update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      // Persist
      await updateTask(taskId, { status: newStatus, userId: currentUser?.id } as any); // pass userId for activity log
      await reload();
    }
  };

  const renderTaskContent = (task: Task) => {
    const proj = task.projectId ? projects.find(p => p.id === task.projectId) : null;
    const assignee = staffList.find(s => s.id === task.assigneeId);
    const overdue = task.status !== 'done' && task.dueDate && task.dueDate < today;

    return (
      <>
        <div className="kanban-card-top">
          <span className={`badge ${priorityColor[task.priority]}`}>{task.priority}</span>
          <div style={{ display: 'flex', gap: 4 }}>
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
          <p className="kanban-card-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {task.description}
          </p>
        )}
        <div className="kanban-card-meta">
          {task.dueDate && (
            <span className={overdue ? 'kanban-meta-overdue' : ''} style={{ color: overdue ? 'var(--accent-rose)' : 'inherit' }}>
              <Calendar size={12} /> {task.dueDate}
            </span>
          )}
          {proj && <span>📁 {proj.name}</span>}
          {assignee && (
            <span className="kanban-assignee" title={assignee.name}>
              <span className="kanban-assignee-dot" style={{ background: assignee.color }}>{assignee.initials}</span>
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="page fade-in">
      <h1 className="page-title">Task Board</h1>
      <p className="page-subtitle">Jira-like task flow with drag & drop</p>

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
            <div className="overdue-badge" style={{ color: 'var(--accent-rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={14} /> {overdueCount} overdue
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => openAdd('backlog')}>
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {tasks.length === 0 && !searchQuery ? (
        <div className="chart-card">
          <div className="empty-state">
            <div className="empty-state-icon"><ListTodo size={28} /></div>
            <h3>No tasks found</h3>
            <p>Your backlog is clean. Time to plan something great.</p>
            <button className="btn btn-primary" onClick={() => openAdd('backlog')}>
              <Plus size={16} /> Create Task
            </button>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {STATUS_COLS.map(status => {
              const colTasks = filteredTasks.filter(t => t.status === status);
              return (
                <KanbanColumn key={status} status={status}>
                  {status === 'backlog' && (
                    <button className="kanban-quick-add" onClick={() => openAdd('backlog')}>
                      <Plus size={14} /> Create issue
                    </button>
                  )}
                  {colTasks.map(task => (
                    <KanbanTaskCard key={task.id} task={task} onClick={() => openEdit(task)}>
                      {renderTaskContent(task)}
                    </KanbanTaskCard>
                  ))}
                  <div style={{ height: '30px', paddingBottom: '30px' }} /> {/* Droppable padding area */}
                </KanbanColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="kanban-card" style={{ opacity: 0.9, cursor: 'grabbing', transform: 'rotate(2deg)' }}>
                {renderTaskContent(activeTask)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {showModal && (
        <Modal
          title={editId ? 'Task Details' : 'Create Issue'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
        >
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Left Column: Form Fields */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Add a detailed description..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })}
                  >
                    {STATUS_COLS.map(s => <option key={s} value={s}>{statusLabels[s].label}</option>)}
                  </select>
                </div>
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
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assignee</label>
                  <select
                    className="form-control"
                    value={form.assigneeId || ''}
                    onChange={e => setForm({ ...form, assigneeId: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Comments Section */}
              {editId && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Comments</h4>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handlePostComment(); }}
                    />
                    <button type="button" className="btn btn-secondary" onClick={handlePostComment} disabled={!newComment.trim()}>
                      Send
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                    {comments.map(c => (
                      <div key={c.id} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <strong>{c.user?.name || 'Unknown'}</strong>
                          <span>{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{c.comment}</p>
                      </div>
                    ))}
                    {comments.length === 0 && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No comments yet.</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sidebar (Activity Log etc) */}
            {editId && (
              <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 24, fontSize: '0.85rem' }}>
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                  <History size={14} /> Activity Log
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {activities.map(act => (
                    <div key={act.id} style={{ display: 'flex', flexDirection: 'column', borderLeft: '2px solid var(--border)', paddingLeft: 12, marginLeft: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(act.timestamp).toLocaleDateString()}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{act.action === 'created' ? 'Created task' : 'Moved task'}</strong>
                      {act.action === 'moved' && (
                        <span>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{statusLabels[act.oldStatus as TaskStatus]?.label}</span>
                          {' → '}
                          <span style={{ color: 'var(--accent-primary)' }}>{statusLabels[act.newStatus as TaskStatus]?.label}</span>
                        </span>
                      )}
                    </div>
                  ))}
                  {activities.length === 0 && <span>No activity yet.</span>}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
