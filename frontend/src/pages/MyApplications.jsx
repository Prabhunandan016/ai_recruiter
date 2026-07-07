import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyApplications } from '../services/api';

const STATUS = {
  submitted:    { label: 'Submitted',    color: '#4f46e5', bg: '#eef2ff', icon: '📤' },
  under_review: { label: 'Under Review', color: '#d97706', bg: '#fef3c7', icon: '🔍' },
  shortlisted:  { label: 'Shortlisted',  color: '#059669', bg: '#d1fae5', icon: '⭐' },
  rejected:     { label: 'Not Selected', color: '#dc2626', bg: '#fee2e2', icon: '✕' },
};

export function MyApplications({ user }) {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getMyApplications(user.user_id)
      .then(r => setApps(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.user_id]);

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  if (loading) return (
    <div style={s.loadState}>
      <div className="spinner-dark" />
      <span style={s.loadText}>Loading applications...</span>
    </div>
  );

  return (
    <div className="page-wrapper-sm">
      {/* Stats */}
      <div style={s.statsGrid}>
        {Object.entries(STATUS).map(([key, cfg]) => (
          <div key={key} style={s.statCard}>
            <span style={s.statIcon}>{cfg.icon}</span>
            <div style={{ ...s.statNum, color: cfg.color }}>{apps.filter(a => a.status === key).length}</div>
            <div style={s.statLabel}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>My Applications</h1>
          <p style={s.pageSub}>{apps.length} total submission{apps.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/jobs')} style={s.browseBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Browse Jobs
        </button>
      </div>

      {/* Filter */}
      <div style={s.filterRow}>
        {['all', ...Object.keys(STATUS)].map(key => (
          <button key={key} onClick={() => setFilter(key)} style={filter === key ? s.filterOn : s.filterOff}>
            {key === 'all' ? 'All' : STATUS[key].label}
            <span style={filter === key ? s.filterBadgeOn : s.filterBadge}>
              {key === 'all' ? apps.length : apps.filter(a => a.status === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📋</div>
          <p style={s.emptyTitle}>{filter === 'all' ? 'No applications yet' : `No ${STATUS[filter]?.label.toLowerCase()} applications`}</p>
          <p style={s.emptySub}>{filter === 'all' ? 'Start applying to jobs and track them here' : 'Check back later'}</p>
          {filter === 'all' && <button onClick={() => navigate('/jobs')} style={s.browseBtn}>Browse Jobs</button>}
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(app => {
            const cfg = STATUS[app.status] || STATUS.submitted;
            return (
              <div key={app._id} style={s.card} className="fade-up">
                <div style={s.cardLeft}>
                  <div style={s.companyAvatar}>{app.job_company?.[0]?.toUpperCase() || '?'}</div>
                </div>
                <div style={s.cardBody}>
                  <div style={s.cardTop}>
                    <div style={{ flex: 1 }}>
                      <h3 style={s.jobTitle}>{app.job_title || 'Position'}</h3>
                      <p style={s.companyName}>
                        {app.job_company || '—'}
                        {app.job_location && <span style={s.dot}> · {app.job_location}</span>}
                      </p>
                    </div>
                    <span style={{ ...s.statusBadge, background: cfg.bg, color: cfg.color }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  <div style={s.cardMeta}>
                    <span style={s.metaItem}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Applied {new Date(app.applied_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{ ...s.metaItem, color: app.job_status === 'active' ? '#059669' : '#dc2626' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                      Job {app.job_status || 'active'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  loadState: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' },
  loadText: { fontSize: '14px', color: '#94a3b8', fontWeight: 500 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '1.1rem', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' },
  statIcon: { fontSize: '20px' },
  statNum: { fontSize: '22px', fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: '11px', color: '#94a3b8', fontWeight: 500 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  pageTitle: { fontSize: '21px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' },
  pageSub: { fontSize: '13px', color: '#94a3b8', marginTop: '3px' },
  browseBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  filterRow: { display: 'flex', gap: '4px', background: '#fff', padding: '5px', borderRadius: '11px', border: '1px solid #e5e7eb', width: 'fit-content', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterOn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#eef2ff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700, color: '#4f46e5', cursor: 'pointer' },
  filterOff: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'none', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 500, color: '#64748b', cursor: 'pointer' },
  filterBadge: { background: '#f1f5f9', color: '#94a3b8', borderRadius: '999px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 },
  filterBadgeOn: { background: '#c7d2fe', color: '#4f46e5', borderRadius: '999px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { background: '#fff', borderRadius: '13px', border: '1px solid #e5e7eb', display: 'flex', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardLeft: { width: '56px', background: 'linear-gradient(180deg,#f5f3ff,#ede9fe)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1.25rem 0', flexShrink: 0 },
  companyAvatar: { width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 },
  cardBody: { flex: 1, padding: '1.1rem 1.25rem' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '1rem' },
  jobTitle: { fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' },
  companyName: { fontSize: '12px', color: '#64748b' },
  dot: { color: '#94a3b8' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 },
  cardMeta: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#94a3b8', fontWeight: 500 },
  empty: { textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' },
  emptyIcon: { fontSize: '44px', marginBottom: '1rem' },
  emptyTitle: { fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: '#94a3b8', marginBottom: '1.5rem' },
};
