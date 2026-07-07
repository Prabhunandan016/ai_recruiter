import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecruiterJobs, updateJobStatus } from '../services/api';
import { JobCard } from '../components/JobCard';

const TABS = ['all', 'active', 'closed', 'draft'];

export function RecruiterDashboard({ user, onCreateJob, onViewRankings }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getRecruiterJobs(user.user_id)
      .then(r => setJobs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.user_id]);

  const handleClose = async (jobId) => {
    if (!window.confirm('Close this job posting?')) return;
    await updateJobStatus(jobId, 'closed');
    setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: 'closed' } : j));
  };

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);
  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const totalApplicants = jobs.reduce((s, j) => s + (j.applicant_count || 0), 0);

  const stats = [
    { label: 'Total Jobs', value: jobs.length, icon: '💼', color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Active', value: activeJobs, icon: '✅', color: '#059669', bg: '#d1fae5' },
    { label: 'Applicants', value: totalApplicants, icon: '👥', color: '#d97706', bg: '#fef3c7' },
    { label: 'Closed', value: jobs.length - activeJobs, icon: '🔒', color: '#dc2626', bg: '#fee2e2' },
  ];

  if (loading) return (
    <div style={s.loadState}>
      <div className="spinner-dark" />
      <span style={s.loadText}>Loading jobs...</span>
    </div>
  );

  return (
    <div className="page-wrapper">
      {/* Stats */}
      <div style={s.statsGrid}>
        {stats.map(st => (
          <div key={st.label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: st.bg }}>{st.icon}</div>
            <div>
              <div style={{ ...s.statNum, color: st.color }}>{st.value}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div>
          <h1 style={s.pageTitle}>Job Postings</h1>
          <p style={s.pageSub}>Manage listings and run AI rankings</p>
        </div>
        <button onClick={onCreateJob || (() => navigate('/recruiter/create'))} style={s.createBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Post New Job
        </button>
      </div>

      {/* Filter tabs */}
      <div style={s.tabsWrap}>
        {TABS.map(tab => {
          const count = tab === 'all' ? jobs.length : jobs.filter(j => j.status === tab).length;
          return (
            <button key={tab} onClick={() => setFilter(tab)} style={filter === tab ? s.tabOn : s.tabOff}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={filter === tab ? s.tabBadgeOn : s.tabBadge}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📭</div>
          <p style={s.emptyTitle}>{filter === 'all' ? 'No jobs yet' : `No ${filter} jobs`}</p>
          <p style={s.emptySub}>{filter === 'all' ? 'Post your first job to start receiving applications' : 'Nothing here right now'}</p>
          {filter === 'all' && (
            <button onClick={() => navigate('/recruiter/create')} style={s.createBtn}>Post a Job</button>
          )}
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(job => (
            <JobCard key={job._id} job={job} isRecruiter
              onViewRankings={onViewRankings || (id => navigate(`/recruiter/rankings/${id}`))}
              onCloseJob={handleClose} />
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  loadState: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' },
  loadText: { fontSize: '14px', color: '#94a3b8', fontWeight: 500 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statIcon: { width: '44px', height: '44px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
  statNum: { fontSize: '26px', fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginTop: '3px' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  pageTitle: { fontSize: '21px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' },
  pageSub: { fontSize: '13px', color: '#94a3b8', marginTop: '3px' },
  createBtn: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' },
  tabsWrap: { display: 'flex', gap: '4px', background: '#fff', padding: '5px', borderRadius: '11px', border: '1px solid #e5e7eb', width: 'fit-content', marginBottom: '1.5rem' },
  tabOn: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 16px', background: '#eef2ff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#4f46e5', cursor: 'pointer' },
  tabOff: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 16px', background: 'none', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#64748b', cursor: 'pointer' },
  tabBadge: { background: '#f1f5f9', color: '#94a3b8', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 },
  tabBadgeOn: { background: '#c7d2fe', color: '#4f46e5', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.25rem' },
  empty: { textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' },
  emptyIcon: { fontSize: '44px', marginBottom: '1rem' },
  emptyTitle: { fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: '#94a3b8', marginBottom: '1.5rem' },
};
