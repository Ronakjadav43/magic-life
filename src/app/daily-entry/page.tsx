'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  Search,
  Link as LinkIcon,
  X,
  History
} from 'lucide-react';
import Modal from '@/components/Modal';
import {
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  getProjects,
  getTasks,
  addTask,
  updateTask,
  getActiveStaff,
  todayStr,
  getTaskComments,
  getTaskActivities,
  addTaskComment
} from '@/lib/store';
import type { DailyEntry, Category, EntryStatus, Project, Task, TaskPriority, TaskStatus, StaffMember, Comment, TaskActivity } from '@/lib/types';

const CATEGORIES: Category[] = ['Learning', 'Freelance', 'Health', 'Personal'];
const STATUSES: EntryStatus[] = ['Done', 'Pending'];
const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

const statusLabels: Record<TaskStatus, { label: string; icon: string }> = {
  backlog: { label: 'Backlog', icon: '📝' },
  todo: { label: 'To Do', icon: '📋' },
  in_progress: { label: 'In Progress', icon: '🔄' },
  review: { label: 'Review', icon: '👀' },
  done: { label: 'Done', icon: '✅' },
};

const defaultForm = {
  date: todayStr(),
  taskName: '',
  taskId: null as string | null,
  category: 'Freelance' as Category,
  projectId: null as string | null,
  timeSpent: 1,
  status: 'Done' as EntryStatus,
  notes: '',
};

const defaultTaskForm = {
  title: '',
  description: '',
  priority: 'Medium' as TaskPriority,
  dueDate: todayStr(),
  projectId: null as string | null,
  status: 'todo' as TaskStatus,
  assigneeId: null as string | null,
};

export default function DailyEntryPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  
  // New Added Tasks feature
  const [addedTasks, setAddedTasks] = useState<Partial<Task>[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);
  const [editTaskIndex, setEditTaskIndex] = useState<number | null>(null);
  const [editExistingTaskId, setEditExistingTaskId] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);

  const [mounted, setMounted] = useState(false);

  const reload = useCallback(async () => {
    const [e, p, t, s] = await Promise.all([getEntries(), getProjects(), getTasks(), getActiveStaff()]);
    setEntries(e);
    setProjects(p);
    setTasks(t);
    setStaffList(s);
    if (s.length > 0) setCurrentUser(s[0]);
  }, []);

  useEffect(() => {
    reload();
    setMounted(true);
  }, [reload]);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  // Apply all filters
  let filtered = entries;
  if (filter !== 'All') filtered = filtered.filter(e => e.category === filter);
  if (statusFilter !== 'All') filtered = filtered.filter(e => e.status === statusFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(e => e.taskName.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q));
  }
  if (dateFrom) filtered = filtered.filter(e => e.date >= dateFrom);
  if (dateTo) filtered = filtered.filter(e => e.date <= dateTo);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...defaultForm, date: todayStr() });
    setAddedTasks([]);
    setShowModal(true);
  };

  const openEdit = (entry: DailyEntry) => {
    setEditId(entry.id);
    setForm({
      date: entry.date,
      taskName: entry.taskName,
      taskId: entry.taskId || null,
      category: entry.category,
      projectId: entry.projectId,
      timeSpent: entry.timeSpent,
      status: entry.status,
      notes: entry.notes,
    });
    
    // Load any additional linked tasks from linkedTaskIds
    const loadedLinkedTasks = (entry.linkedTaskIds || [])
      .filter(id => id !== entry.taskId)
      .map(id => tasks.find(t => t.id === id))
      .filter(t => !!t) as Partial<Task>[];
      
    setAddedTasks(loadedLinkedTasks);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.taskId && !form.taskName.trim() && addedTasks.length === 0) return;

    let finalTaskId = form.taskId;
    let finalTaskName = form.taskName;
    const finalLinkedTaskIds = [];

    // Include primary taskId in the list of linkedTaskIds so the backend tracks them all
    if (finalTaskId) {
       finalLinkedTaskIds.push(finalTaskId);
    }

    // Process all additional tasks
    for (const t of addedTasks) {
       if (t.id) {
           finalLinkedTaskIds.push(t.id);
       } else {
           const newTask = await addTask(t as any);
           finalLinkedTaskIds.push(newTask.id);
           // auto-link the first created task as primary if none exists
           if (!finalTaskId) {
              finalTaskId = newTask.id;
              finalTaskName = newTask.title;
           }
       }
    }

    // Deduplicate array
    const dedupedLinkedTaskIds = Array.from(new Set(finalLinkedTaskIds));

    const payload = { 
        ...form, 
        taskId: finalTaskId, 
        taskName: finalTaskName,
        linkedTaskIds: dedupedLinkedTaskIds
    };

    if (editId) {
      await updateEntry(editId, payload);
    } else {
      await addEntry(payload);
    }
    setShowModal(false);
    await reload();
  };

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return;

    if (editExistingTaskId) {
      await updateTask(editExistingTaskId, taskForm);
      await reload(); // Refresh tasks so UI reflects change
    } else if (editTaskIndex !== null) {
      // It's possible the task in the queue already has an ID (if it was loaded from linkedTaskIds)
      const existingTaskInQueue = addedTasks[editTaskIndex];
      if (existingTaskInQueue.id) {
         await updateTask(existingTaskInQueue.id, taskForm);
         await reload();
         const newTasks = [...addedTasks];
         newTasks[editTaskIndex] = { ...existingTaskInQueue, ...taskForm };
         setAddedTasks(newTasks);
      } else {
         const newTasks = [...addedTasks];
         newTasks[editTaskIndex] = taskForm;
         setAddedTasks(newTasks);
      }
    } else {
      setAddedTasks([...addedTasks, taskForm]);
    }

    setShowTaskModal(false);
    setTaskForm({ ...defaultTaskForm, projectId: form.projectId });
    setEditTaskIndex(null);
    setEditExistingTaskId(null);
  };

  const handlePostComment = async () => {
    if (!editExistingTaskId || !newComment.trim() || !currentUser) return;
    await addTaskComment(editExistingTaskId, currentUser.id, newComment);
    setNewComment('');
    const c = await getTaskComments(editExistingTaskId);
    setComments(c);
  };

  const handleDeleteTask = (index: number) => {
    setAddedTasks(addedTasks.filter((_, i) => i !== index));
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    await reload();
  };

  const handleToggleStatus = async (entry: DailyEntry) => {
    await updateEntry(entry.id, { status: entry.status === 'Done' ? 'Pending' : 'Done' });
    await reload();
  };

  const clearFilters = () => {
    setFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = filter !== 'All' || statusFilter !== 'All' || searchQuery || dateFrom || dateTo;

  return (
    <div className="page fade-in">
      <h1 className="page-title">Daily Entry</h1>
      <p className="page-subtitle">Track what you actually do every day — linked powerfully into your tasks</p>

      {/* Search & Filters */}
      <div className="toolbar">
        <div className="toolbar-left" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="search-input-wrap">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> New Entry
        </button>
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div className="category-pills" style={{ marginBottom: 0 }}>
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
        <div className="category-pills" style={{ marginBottom: 0 }}>
          {['All', ...STATUSES].map(s => (
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

      {/* Date Range */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>From</label>
          <input type="date" className="form-control" style={{ width: 160 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>To</label>
          <input type="date" className="form-control" style={{ width: 160 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        {hasFilters && (
          <button className="btn btn-sm btn-secondary" onClick={clearFilters}>Clear All</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="chart-card">
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays size={28} /></div>
            <h3>{hasFilters ? 'No matching entries' : 'No entries yet'}</h3>
            <p>{hasFilters ? 'Try adjusting your filters' : 'Start tracking your daily work to build momentum'}</p>
            {!hasFilters && (
              <button className="btn btn-primary" onClick={openAdd}>
                <Plus size={16} /> Add First Entry
              </button>
            )}
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
                const proj = entry.projectId ? projects.find(p => p.id === entry.projectId) : null;
                const linkedTask = entry.taskId ? tasks.find(t => t.id === entry.taskId) : null;

                return (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>
                      <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {entry.taskName}
                        {linkedTask && <span title={`Linked to Task: ${linkedTask.status}`}><LinkIcon size={12} color="var(--accent-primary)" /></span>}
                      </div>
                    </td>
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
          
          <div className="form-row">
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
              <label>Linked Task (Existing)</label>
              <select
                className="form-control"
                value={form.taskId || ''}
                onChange={e => {
                  const t = tasks.find(x => x.id === e.target.value);
                  setForm({
                    ...form, 
                    taskId: t?.id || null, 
                    taskName: t ? t.title : '', 
                    projectId: t?.projectId || form.projectId // Auto-inherit project!
                  });
                }}
              >
                <option value="">-- No Linked Task (Free Text) --</option>
                {tasks.map(t => (
                   <option key={t.id} value={t.id}>[{t.status.toUpperCase()}] {t.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
             {!form.taskId && (
                <input
                   type="text"
                   className="form-control"
                   placeholder="Or type a free-text entry name if no link needed..."
                   value={form.taskName}
                   onChange={e => setForm({ ...form, taskName: e.target.value })}
                />
             )}
          </div>

          <div className="form-group" style={{ 
            marginTop: 16, 
            padding: 16, 
            background: 'var(--bg-secondary)', 
            borderRadius: 8, 
            border: '1px solid var(--border)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
               <span style={{ fontWeight: 600 }}>Included Tasks</span>
               <button 
                 type="button" 
                 onClick={() => {
                   setEditTaskIndex(null);
                   setEditExistingTaskId(null);
                   setTaskForm({ ...defaultTaskForm, projectId: form.projectId });
                   setComments([]);
                   setActivities([]);
                   setShowTaskModal(true);
                 }} 
                 className="btn btn-sm btn-primary"
                 style={{ fontSize: 12, padding: '4px 12px' }}
               >
                 + Add new task
               </button>
            </div>
            
            {addedTasks.length === 0 && !form.taskId ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No tasks linked. Select from existing or add a new task to track.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Render already linked task if it exists */}
                {form.taskId && tasks.find(t => t.id === form.taskId) && (
                  <div style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--accent-primary)', opacity: 0.9, cursor: 'pointer'
                  }}
                  onClick={async () => {
                     const t = tasks.find(x => x.id === form.taskId);
                     if (t) {
                        setEditExistingTaskId(t.id);
                        setEditTaskIndex(null);
                        setTaskForm({
                          title: t.title,
                          description: t.description,
                          priority: t.priority,
                          dueDate: t.dueDate,
                          projectId: t.projectId,
                          status: t.status,
                          assigneeId: t.assigneeId ?? null
                        });
                        const [c, a] = await Promise.all([getTaskComments(t.id), getTaskActivities(t.id)]);
                        setComments(c);
                        setActivities(a);
                        setShowTaskModal(true);
                     }
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                         {tasks.find(t => t.id === form.taskId)?.title} <span style={{fontSize: 10, backgroundColor: 'var(--accent-primary)', color: '#fff', padding: '2px 6px', borderRadius: 4, marginLeft: 6}}>Linked</span>
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Priority: {tasks.find(t => t.id === form.taskId)?.priority} | Status: {tasks.find(t => t.id === form.taskId)?.status}
                      </span>
                    </div>
                    {/* Allow unlinking */}
                    <button type="button" className="btn-icon" onClick={(e) => { e.stopPropagation(); setForm({ ...form, taskId: null, taskName: '' }); }} style={{ color: 'var(--accent-rose)' }} title="Unlink task">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Render newly queued tasks */}
                {addedTasks.map((t, idx) => (
                  <div key={`new-${idx}`} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px dashed var(--border)', cursor: 'pointer'
                  }}
                  onClick={async () => {
                     setEditTaskIndex(idx);
                     if (t.id) {
                        setEditExistingTaskId(t.id);
                        setTaskForm(t as any);
                        const [c, a] = await Promise.all([getTaskComments(t.id), getTaskActivities(t.id)]);
                        setComments(c);
                        setActivities(a);
                     } else {
                        setEditExistingTaskId(null);
                        setTaskForm(t as any);
                        setComments([]);
                        setActivities([]);
                     }
                     setShowTaskModal(true);
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                         {t.title} 
                         {t.id ? (
                            <span style={{fontSize: 10, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: 4, marginLeft: 6}}>Linked (Additional)</span>
                         ) : (
                            <span style={{fontSize: 10, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, marginLeft: 6}}>To be created</span>
                         )}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Priority: {t.priority} | Status: {t.status}
                      </span>
                    </div>
                    <button type="button" className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDeleteTask(idx); }} style={{ color: 'var(--accent-rose)' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row" style={{ marginTop: 16 }}>
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

      {/* Nested Add Task Modal */}
      {showTaskModal && (
        <Modal
          title={editExistingTaskId || editTaskIndex !== null ? 'Task Details' : 'Add New Task'}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleSaveTask}
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
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Add a detailed description..."
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })}
                  >
                    {TASK_STATUSES.map(s => <option key={s} value={s}>{statusLabels[s]?.label || s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-control"
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                  >
                    {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assignee</label>
                  <select
                    className="form-control"
                    value={taskForm.assigneeId || ''}
                    onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value || null })}
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
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div style={{ marginTop: 24, opacity: editExistingTaskId ? 1 : 0.6, pointerEvents: editExistingTaskId ? 'auto' : 'none' }}>
                <h4 style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Comments</h4>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={editExistingTaskId ? "Add a comment..." : "Save task first to add comments..."}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handlePostComment(); }}
                    disabled={!editExistingTaskId}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handlePostComment} disabled={!newComment.trim() || !editExistingTaskId}>
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
            </div>

            {/* Right Column: Sidebar (Activity Log etc) */}
            <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 24, fontSize: '0.85rem', opacity: editExistingTaskId ? 1 : 0.6 }}>
              <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <History size={14} /> Activity Log
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!editExistingTaskId ? (
                   <span style={{ color: 'var(--text-muted)' }}>Save this task to begin tracking activity.</span>
                ) : (
                   <>
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
                   </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

