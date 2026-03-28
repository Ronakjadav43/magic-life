'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Linkedin,
  Globe,
  ArrowRight,
  DollarSign,
  Search,
} from 'lucide-react';
import Modal from '@/components/Modal';
import {
  getLeads,
  addLead,
  updateLead,
  deleteLead,
  todayStr,
} from '@/lib/store';
import type { Lead, LeadStatus, LeadPlatform } from '@/lib/types';

const STATUS_LIST: LeadStatus[] = ['New', 'Contacted', 'Replied', 'Closed'];
const PLATFORMS: LeadPlatform[] = ['LinkedIn', 'Upwork', 'Direct', 'Other'];

const defaultForm = {
  date: todayStr(),
  clientName: '',
  platform: 'LinkedIn' as LeadPlatform,
  proposalSent: false,
  followUpDate: '',
  status: 'New' as LeadStatus,
  dealValue: 0,
};

const platformIcon = (p: LeadPlatform) => {
  if (p === 'LinkedIn') return <Linkedin size={14} />;
  return <Globe size={14} />;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [mounted, setMounted] = useState(false);

  const reload = useCallback(() => setLeads(getLeads()), []);

  useEffect(() => {
    reload();
    setMounted(true);
  }, [reload]);

  if (!mounted) return <div className="page"><div className="page-title">Loading...</div></div>;

  const openAdd = (status: LeadStatus = 'New') => {
    setEditId(null);
    setForm({ ...defaultForm, date: todayStr(), status });
    setShowModal(true);
  };

  const openEdit = (lead: Lead) => {
    setEditId(lead.id);
    setForm({
      date: lead.date,
      clientName: lead.clientName,
      platform: lead.platform,
      proposalSent: lead.proposalSent,
      followUpDate: lead.followUpDate,
      status: lead.status,
      dealValue: lead.dealValue,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.clientName.trim()) return;
    if (editId) {
      updateLead(editId, form);
    } else {
      addLead(form);
    }
    setShowModal(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteLead(id);
    reload();
  };

  const moveToNext = (lead: Lead) => {
    const idx = STATUS_LIST.indexOf(lead.status);
    if (idx < STATUS_LIST.length - 1) {
      updateLead(lead.id, { status: STATUS_LIST[idx + 1] });
      reload();
    }
  };

  const totalPipeline = leads
    .filter(l => l.status !== 'Closed')
    .reduce((s, l) => s + l.dealValue, 0);

  const totalClosed = leads
    .filter(l => l.status === 'Closed')
    .reduce((s, l) => s + l.dealValue, 0);

  return (
    <div className="page fade-in">
      <h1 className="page-title">Leads &amp; Proposals</h1>
      <p className="page-subtitle">Track all freelance opportunities and client outreach</p>

      {/* Pipeline Value Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Pipeline Value</span>
            <div className="stat-card-icon blue"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">₹{totalPipeline.toLocaleString()}</div>
          <div className="stat-card-sub">{leads.filter(l => l.status !== 'Closed').length} active leads</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-label">Closed Revenue</span>
            <div className="stat-card-icon emerald"><DollarSign size={20} /></div>
          </div>
          <div className="stat-card-value">₹{totalClosed.toLocaleString()}</div>
          <div className="stat-card-sub">{leads.filter(l => l.status === 'Closed').length} deals closed</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="category-pills" style={{ marginBottom: 0 }}>
            {['All', ...PLATFORMS].map(p => (
              <button
                key={p}
                className={`category-pill ${platformFilter === p ? 'active' : ''}`}
                onClick={() => setPlatformFilter(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd('New')}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Pipeline Board */}
      {leads.length === 0 ? (
        <div className="chart-card">
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={28} /></div>
            <h3>No leads yet</h3>
            <p>Start adding leads to build your client pipeline</p>
            <button className="btn btn-primary" onClick={() => openAdd('New')}>
              <Plus size={16} /> Add First Lead
            </button>
          </div>
        </div>
      ) : (
        <div className="pipeline">
          {STATUS_LIST.map(status => {
            let cols = leads.filter(l => l.status === status);
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              cols = cols.filter(l => l.clientName.toLowerCase().includes(q));
            }
            if (platformFilter !== 'All') {
              cols = cols.filter(l => l.platform === platformFilter);
            }
            return (
              <div key={status} className="pipeline-col">
                <div className="pipeline-col-header">
                  <span className="pipeline-col-title">{status}</span>
                  <span className="pipeline-col-count">{cols.length}</span>
                </div>
                {cols.map(lead => (
                  <div key={lead.id} className="pipeline-card" onClick={() => openEdit(lead)}>
                    <h4>{lead.clientName}</h4>
                    <div className="pipeline-card-meta">
                      <span>{platformIcon(lead.platform)} {lead.platform}</span>
                      <span>📅 {lead.date}</span>
                      {lead.proposalSent && <span style={{ color: 'var(--accent-emerald)' }}>✓ Proposal sent</span>}
                      {lead.followUpDate && <span>🔔 Follow-up: {lead.followUpDate}</span>}
                    </div>
                    {lead.dealValue > 0 && (
                      <div className="pipeline-card-value">₹{lead.dealValue.toLocaleString()}</div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      {status !== 'Closed' && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => { e.stopPropagation(); moveToNext(lead); }}
                        >
                          Move <ArrowRight size={12} />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal
          title={editId ? 'Edit Lead' : 'New Lead'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
        >
          <div className="form-group">
            <label>Client Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Client or company name"
              value={form.clientName}
              onChange={e => setForm({ ...form, clientName: e.target.value })}
            />
          </div>
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
              <label>Platform</label>
              <select
                className="form-control"
                value={form.platform}
                onChange={e => setForm({ ...form, platform: e.target.value as LeadPlatform })}
              >
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as LeadStatus })}
              >
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Deal Value (₹)</label>
              <input
                type="number"
                className="form-control"
                min={0}
                value={form.dealValue}
                onChange={e => setForm({ ...form, dealValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Proposal Sent</label>
              <select
                className="form-control"
                value={form.proposalSent ? 'yes' : 'no'}
                onChange={e => setForm({ ...form, proposalSent: e.target.value === 'yes' })}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                className="form-control"
                value={form.followUpDate}
                onChange={e => setForm({ ...form, followUpDate: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
