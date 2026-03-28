'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Clock, FileCheck, AlertTriangle,
  ChevronDown, ChevronUp, User, Calendar, MessageSquare,
} from 'lucide-react';
import {
  getTasks, updateTask, getEntries, updateEntry,
  getStaff, getPendingApprovals,
} from '@/lib/store';
import type { Task, DailyEntry, StaffMember, ApprovalStatus } from '@/lib/types';

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  'Pending Review': 'var(--accent-amber)',
  'Approved': 'var(--accent-emerald)',
  'Rejected': 'var(--accent-rose)',
  'Not Submitted': 'var(--text-muted)',
};

const STATUS_BG: Record<ApprovalStatus, string> = {
  'Pending Review': 'rgba(245,158,11,0.12)',
  'Approved': 'rgba(16,185,129,0.12)',
  'Rejected': 'rgba(244,63,94,0.12)',
  'Not Submitted': 'rgba(148,163,184,0.08)',
};

export default function ApprovalsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [tab, setTab] = useState<TabType>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [mounted, setMounted] = useState(false);

  const reload = useCallback(() => {
    setTasks(getTasks());
    setEntries(getEntries());
    setStaff(getStaff());
  }, []);

  useEffect(() => {
    reload();
    setMounted(true);
  }, [reload]);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  const getStaffName = (id?: string | null) => {
    if (!id) return 'Unassigned';
    const s = staff.find(m => m.id === id);
    return s ? s.name : 'Unknown';
  };

  const getStaffMember = (id?: string | null) => {
    if (!id) return null;
    return staff.find(m => m.id === id) || null;
  };

  // Filter items by approval status
  const filterByTab = (approval?: ApprovalStatus) => {
    if (tab === 'pending') return approval === 'Pending Review';
    if (tab === 'approved') return approval === 'Approved';
    if (tab === 'rejected') return approval === 'Rejected';
    return true;
  };

  const filteredTasks = tasks.filter(t => t.approval && filterByTab(t.approval));
  const filteredEntries = entries.filter(e => e.approval && filterByTab(e.approval));

  const pending = getPendingApprovals();
  const pendingCount = pending.tasks.length + pending.entries.length;
  const approvedCount = tasks.filter(t => t.approval === 'Approved').length + entries.filter(e => e.approval === 'Approved').length;
  const rejectedCount = tasks.filter(t => t.approval === 'Rejected').length + entries.filter(e => e.approval === 'Rejected').length;

  const handleApproveTask = (id: string, status: 'Approved' | 'Rejected') => {
    updateTask(id, { approval: status, approvedBy: 'Admin', approvalNote: approvalNote || undefined });
    setApprovalNote('');
    setExpandedId(null);
    reload();
  };

  const handleApproveEntry = (id: string, status: 'Approved' | 'Rejected') => {
    updateEntry(id, { approval: status, approvedBy: 'Admin', approvalNote: approvalNote || undefined });
    setApprovalNote('');
    setExpandedId(null);
    reload();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setApprovalNote('');
  };

  return (
    <div className="page fade-in">
      <h1 className="page-title">Approvals</h1>
      <p className="page-subtitle">Review and approve tasks and daily entries</p>

      {/* Stats */}
      <div className="approval-stats">
        <div className="approval-stat-card" style={{ borderLeftColor: 'var(--accent-amber)' }}>
          <Clock size={20} style={{ color: 'var(--accent-amber)' }} />
          <div>
            <div className="approval-stat-value">{pendingCount}</div>
            <div className="approval-stat-label">Pending</div>
          </div>
        </div>
        <div className="approval-stat-card" style={{ borderLeftColor: 'var(--accent-emerald)' }}>
          <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
          <div>
            <div className="approval-stat-value">{approvedCount}</div>
            <div className="approval-stat-label">Approved</div>
          </div>
        </div>
        <div className="approval-stat-card" style={{ borderLeftColor: 'var(--accent-rose)' }}>
          <XCircle size={20} style={{ color: 'var(--accent-rose)' }} />
          <div>
            <div className="approval-stat-value">{rejectedCount}</div>
            <div className="approval-stat-label">Rejected</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="approval-tabs">
        {([
          { key: 'pending' as TabType, label: 'Pending Review', count: pendingCount, icon: Clock },
          { key: 'approved' as TabType, label: 'Approved', count: approvedCount, icon: CheckCircle2 },
          { key: 'rejected' as TabType, label: 'Rejected', count: rejectedCount, icon: XCircle },
          { key: 'all' as TabType, label: 'All', count: filteredTasks.length + filteredEntries.length, icon: FileCheck },
        ]).map(t => (
          <button
            key={t.key}
            className={`approval-tab ${tab === t.key ? 'approval-tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={16} /> {t.label}
            {t.count > 0 && <span className="approval-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {filteredTasks.length === 0 && filteredEntries.length === 0 ? (
        <div className="chart-card">
          <div className="empty-state">
            <div className="empty-state-icon"><FileCheck size={28} /></div>
            <h3>{tab === 'pending' ? 'No pending approvals' : `No ${tab} items`}</h3>
            <p>{tab === 'pending' ? 'All submissions have been reviewed!' : 'Items will appear here when they match this filter.'}</p>
          </div>
        </div>
      ) : (
        <div className="approval-list">
          {/* Tasks */}
          {filteredTasks.length > 0 && (
            <>
              <h3 className="approval-section-title">📋 Tasks ({filteredTasks.length})</h3>
              {filteredTasks.map(task => {
                const assignee = getStaffMember(task.assigneeId);
                const isExpanded = expandedId === `task-${task.id}`;
                return (
                  <div key={task.id} className="approval-item">
                    <div className="approval-item-header" onClick={() => toggleExpand(`task-${task.id}`)}>
                      <div className="approval-item-left">
                        <div
                          className="approval-status-dot"
                          style={{ background: STATUS_COLORS[task.approval || 'Not Submitted'] }}
                        />
                        <div>
                          <div className="approval-item-title">{task.title}</div>
                          <div className="approval-item-meta">
                            {assignee && (
                              <span className="approval-meta-tag">
                                <User size={11} /> {assignee.name}
                              </span>
                            )}
                            <span className="approval-meta-tag">
                              <Calendar size={11} /> {task.dueDate || 'No date'}
                            </span>
                            <span className={`badge ${task.priority === 'Urgent' ? 'badge-overdue' : task.priority === 'High' ? 'badge-pending' : 'badge-active'}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="approval-item-right">
                        <span
                          className="approval-status-badge"
                          style={{
                            color: STATUS_COLORS[task.approval || 'Not Submitted'],
                            background: STATUS_BG[task.approval || 'Not Submitted'],
                          }}
                        >
                          {task.approval}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="approval-item-body">
                        {task.description && (
                          <p className="approval-item-desc">{task.description}</p>
                        )}
                        {task.approvalNote && (
                          <div className="approval-note-display">
                            <MessageSquare size={14} /> <strong>Note:</strong> {task.approvalNote}
                          </div>
                        )}
                        {task.approval === 'Pending Review' && (
                          <div className="approval-actions">
                            <textarea
                              className="form-control approval-note-input"
                              placeholder="Add approval note (optional)..."
                              rows={2}
                              value={approvalNote}
                              onChange={e => setApprovalNote(e.target.value)}
                            />
                            <div className="approval-buttons">
                              <button
                                className="btn btn-approve"
                                onClick={() => handleApproveTask(task.id, 'Approved')}
                              >
                                <CheckCircle2 size={16} /> Approve
                              </button>
                              <button
                                className="btn btn-reject"
                                onClick={() => handleApproveTask(task.id, 'Rejected')}
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Entries */}
          {filteredEntries.length > 0 && (
            <>
              <h3 className="approval-section-title" style={{ marginTop: 24 }}>📝 Daily Entries ({filteredEntries.length})</h3>
              {filteredEntries.map(entry => {
                const assignee = getStaffMember(entry.assigneeId);
                const isExpanded = expandedId === `entry-${entry.id}`;
                return (
                  <div key={entry.id} className="approval-item">
                    <div className="approval-item-header" onClick={() => toggleExpand(`entry-${entry.id}`)}>
                      <div className="approval-item-left">
                        <div
                          className="approval-status-dot"
                          style={{ background: STATUS_COLORS[entry.approval || 'Not Submitted'] }}
                        />
                        <div>
                          <div className="approval-item-title">{entry.taskName}</div>
                          <div className="approval-item-meta">
                            {assignee && (
                              <span className="approval-meta-tag">
                                <User size={11} /> {assignee.name}
                              </span>
                            )}
                            <span className="approval-meta-tag">
                              <Calendar size={11} /> {entry.date}
                            </span>
                            <span className="badge badge-active">{entry.category}</span>
                            <span>{entry.timeSpent}h</span>
                          </div>
                        </div>
                      </div>
                      <div className="approval-item-right">
                        <span
                          className="approval-status-badge"
                          style={{
                            color: STATUS_COLORS[entry.approval || 'Not Submitted'],
                            background: STATUS_BG[entry.approval || 'Not Submitted'],
                          }}
                        >
                          {entry.approval}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="approval-item-body">
                        {entry.notes && <p className="approval-item-desc">{entry.notes}</p>}
                        {entry.approvalNote && (
                          <div className="approval-note-display">
                            <MessageSquare size={14} /> <strong>Note:</strong> {entry.approvalNote}
                          </div>
                        )}
                        {entry.approval === 'Pending Review' && (
                          <div className="approval-actions">
                            <textarea
                              className="form-control approval-note-input"
                              placeholder="Add approval note (optional)..."
                              rows={2}
                              value={approvalNote}
                              onChange={e => setApprovalNote(e.target.value)}
                            />
                            <div className="approval-buttons">
                              <button
                                className="btn btn-approve"
                                onClick={() => handleApproveEntry(entry.id, 'Approved')}
                              >
                                <CheckCircle2 size={16} /> Approve
                              </button>
                              <button
                                className="btn btn-reject"
                                onClick={() => handleApproveEntry(entry.id, 'Rejected')}
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
