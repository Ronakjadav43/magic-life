'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Users, Search,
  Shield, UserCog, User, Mail, ToggleLeft, ToggleRight,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { getStaff, addStaff, updateStaff, deleteStaff } from '@/lib/store';
import type { StaffMember, StaffRole } from '@/lib/types';

const ROLES: StaffRole[] = ['Admin', 'Manager', 'Staff'];

const ROLE_ICON: Record<StaffRole, typeof Shield> = {
  Admin: Shield,
  Manager: UserCog,
  Staff: User,
};

const ROLE_COLOR: Record<StaffRole, string> = {
  Admin: 'var(--accent-rose)',
  Manager: 'var(--accent-amber)',
  Staff: 'var(--accent-blue)',
};

const defaultForm = {
  name: '',
  email: '',
  role: 'Staff' as StaffRole,
  active: true,
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'All'>('All');
  const [mounted, setMounted] = useState(false);

  const reload = useCallback(() => setStaff(getStaff()), []);

  useEffect(() => {
    reload();
    setMounted(true);
  }, [reload]);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  const filtered = staff
    .filter(s => roleFilter === 'All' || s.role === roleFilter)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditId(s.id);
    setForm({ name: s.name, email: s.email, role: s.role, active: s.active });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      updateStaff(editId, form);
    } else {
      addStaff(form);
    }
    setShowModal(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteStaff(id);
    reload();
  };

  const toggleActive = (s: StaffMember) => {
    updateStaff(s.id, { active: !s.active });
    reload();
  };

  const activeCount = staff.filter(s => s.active).length;

  return (
    <div className="page fade-in">
      <h1 className="page-title">Team & Staff</h1>
      <p className="page-subtitle">Manage your team members and their roles</p>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search staff..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-pills">
            {(['All', ...ROLES] as const).map(r => (
              <button
                key={r}
                className={`pill ${roleFilter === r ? 'pill-active' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="staff-stats">
        <div className="staff-stat-card">
          <span className="staff-stat-label">Total</span>
          <span className="staff-stat-value">{staff.length}</span>
        </div>
        <div className="staff-stat-card">
          <span className="staff-stat-label">Active</span>
          <span className="staff-stat-value" style={{ color: 'var(--accent-emerald)' }}>{activeCount}</span>
        </div>
        <div className="staff-stat-card">
          <span className="staff-stat-label">Admins</span>
          <span className="staff-stat-value" style={{ color: 'var(--accent-rose)' }}>{staff.filter(s => s.role === 'Admin').length}</span>
        </div>
        <div className="staff-stat-card">
          <span className="staff-stat-label">Managers</span>
          <span className="staff-stat-value" style={{ color: 'var(--accent-amber)' }}>{staff.filter(s => s.role === 'Manager').length}</span>
        </div>
      </div>

      {/* Staff Grid */}
      {staff.length === 0 ? (
        <div className="chart-card">
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={28} /></div>
            <h3>No team members yet</h3>
            <p>Add your first team member to start assigning tasks</p>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add First Member
            </button>
          </div>
        </div>
      ) : (
        <div className="staff-grid">
          {filtered.map(s => {
            const RoleIcon = ROLE_ICON[s.role];
            return (
              <div key={s.id} className={`staff-card ${!s.active ? 'staff-card-inactive' : ''}`}>
                <div className="staff-card-header">
                  <div className="staff-avatar" style={{ background: s.color }}>
                    {s.initials}
                  </div>
                  <div className="staff-card-actions">
                    <button className="btn-icon" onClick={() => toggleActive(s)} title={s.active ? 'Deactivate' : 'Activate'}>
                      {s.active ? <ToggleRight size={18} style={{ color: 'var(--accent-emerald)' }} /> : <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />}
                    </button>
                    <button className="btn-icon" onClick={() => openEdit(s)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(s.id)} style={{ color: 'var(--accent-rose)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="staff-card-name">{s.name}</h3>
                <div className="staff-card-email">
                  <Mail size={12} /> {s.email}
                </div>
                <div className="staff-card-footer">
                  <span className="staff-role-badge" style={{ color: ROLE_COLOR[s.role], borderColor: ROLE_COLOR[s.role] }}>
                    <RoleIcon size={12} /> {s.role}
                  </span>
                  <span className={`staff-status-dot ${s.active ? 'active' : 'inactive'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal
          title={editId ? 'Edit Member' : 'Add Team Member'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
        >
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="john@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select
                className="form-control"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value as StaffRole })}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={form.active ? 'active' : 'inactive'}
                onChange={e => setForm({ ...form, active: e.target.value === 'active' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
