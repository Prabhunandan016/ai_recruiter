import React, { useState, useEffect } from 'react';
import { getJobs, hasApplied } from '../services/api';
import { JobCard } from '../components/JobCard';

export function CandidateDashboard({ user, onApply }) {
  const [jobs, setJobs] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const { data: list } = await getJobs();
        setJobs(list);
        const checks = await Promise.allSettled(list.map(j => hasApplied(j._id, user.user_id)));
        const ids = new Set();
        checks.forEach((r, i) => { if (r.status === 'fulfilled' && r.value.data.applied) ids.add(list[i]._id); });
        setAppliedIds(ids);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [user.user_id]);

  const filtered = jobs.filter(job => {
    const q = search.toLowerCase();
    const matchSearch = !q || job.title?.toLowerCase().includes(q) || job.company?.toLowerCase().includes(q) || job.required_skills?.some(s => s.toLowerCase().includes(q));
    const matchType = typeFilter === 'all' || job.job_type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return (
    <div style={s.loadState}>
      <div className="spinner-dark" />
      <span style={s.loadText}>Loading opportunities...</span>
    </div>
  );

  return (
    <div className="page-wrapper">
      {/* Stats */}
      <div style={s.statsGrid}>
        {[
          { label: 'Open Roles', value: jobs.length, color: '#4f46e5', bg: '#eef2ff', icon: '🔍' },
          { label: 'Applied', value: appliedIds.size, color: '#059669', bg: '#d1fae5', icon: '📤' },
          { label: 'Available', value: jobs.length - appliedIds.size, color: '#d97706', bg: '#fef3c7', icon: '✨' },
        ].map(st => (
          <div key={st.label} style={s.statCard}>
            <div style={{ ...s.statIcon, background: st.bg }}>{st.icon}</div>
            <div>
              <div style={{ ...s.statNum, color: st.color }}>{st.value}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <h1 style={s.pageTitle}>Browse Opportunities</h1>
          <p style={s.pageSub}>Discover roles that match your skills and aspirations</p>
        </div>
      </div>

      {/* Search + filter */}
      <div style={s.toolbar}>
        <div style={s.searchBox}>
          <svg style={s.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={s.searchInput} placeholder="Search by title, company or skill…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
        </div>
        <select style={s.select} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="remote">Remote</option>
          <option value="internship">Internship</option>
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🔍</div>
          <p style={s.emptyTitle}>No results found</p>
          <p style={s.emptySub}>Try a different search term or filter</p>
          {search && <button style={s.clearSearchBtn} onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <>
          <p style={s.resultsCount}>{filtered.length} job{filtered.length !== 1 ? 's' : ''} found</p>
          <div style={s.grid}>
            {filtered.map(job => (
              <JobCard key={job._id} job={job} isRecruiter={false}
                alreadyApplied={appliedIds.has(job._id)}
                onApply={j => { setAppliedIds(p => new Set(p).add(j._id)); onApply(j); }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  loadState: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' },
  loadText: { fontSize: '14px', color: '#94a3b8', fontWeight: 500 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statIcon: { width: '44px', height: '44px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
  statNum: { fontSize: '26px', fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginTop: '3px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle: { fontSize: '21px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' },
  pageSub: { fontSize: '13px', color: '#94a3b8', marginTop: '3px' },
  toolbar: { display: 'flex', gap: '10px', marginBottom: '1.25rem' },
  searchBox: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '10px 36px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', background: '#fff', color: '#0f172a', boxSizing: 'border-box' },
  clearBtn: { position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '13px', padding: '4px' },
  select: { padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', background: '#fff', color: '#374151', cursor: 'pointer', minWidth: '140px', fontFamily: 'inherit' },
  resultsCount: { fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.25rem' },
  empty: { textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' },
  emptyIcon: { fontSize: '44px', marginBottom: '1rem' },
  emptyTitle: { fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: '#94a3b8', marginBottom: '1.25rem' },
  clearSearchBtn: { padding: '8px 20px', background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
};
