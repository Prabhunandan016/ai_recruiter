import React from 'react';

const TYPE_COLORS = { 'full-time': '#059669', 'part-time': '#d97706', contract: '#7c3aed', remote: '#0891b2', internship: '#db2777' };
const STATUS_MAP = { active: { label: 'Active', color: '#059669', bg: '#d1fae5' }, closed: { label: 'Closed', color: '#dc2626', bg: '#fee2e2' }, draft: { label: 'Draft', color: '#d97706', bg: '#fef3c7' } };

export function JobCard({ job, onApply, onViewRankings, isRecruiter, onCloseJob, alreadyApplied }) {
  const status = STATUS_MAP[job.status] || STATUS_MAP.active;
  const typeColor = TYPE_COLORS[job.job_type] || '#6b7280';

  return (
    <div style={s.card} className="fade-up">
      {/* Header */}
      <div style={s.cardHeader}>
        <div style={s.companyAvatar}>{job.company?.[0]?.toUpperCase()}</div>
        <div style={s.headerMeta}>
          <span style={{ ...s.statusPill, background: status.bg, color: status.color }}>
            <span style={{ ...s.statusDot, background: status.color }} />
            {status.label}
          </span>
          {job.work_location && (
            <span style={s.locationPill}>{job.work_location}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={s.body}>
        <h3 style={s.title}>{job.title}</h3>
        <p style={s.company}>
          {job.company}
          {job.company_location && <span style={s.location}> · {job.company_location}</span>}
        </p>

        <div style={s.tags}>
          <span style={{ ...s.tag, color: typeColor, background: `${typeColor}14` }}>
            {job.job_type || 'full-time'}
          </span>
          {(job.exp_min !== undefined && job.exp_max !== undefined) && (
            <span style={s.tag}>{job.exp_min}–{job.exp_max} yrs</span>
          )}
          {job.required_qualifications?.length > 0 && (
            <span style={s.tag}>{job.required_qualifications.slice(0, 2).join(', ')}</span>
          )}
        </div>

        <p style={s.desc}>{job.job_description?.substring(0, 100)}{job.job_description?.length > 100 ? '...' : ''}</p>

        <div style={s.skills}>
          {job.required_skills?.slice(0, 4).map(sk => (
            <span key={sk} style={s.skill}>{sk}</span>
          ))}
          {job.required_skills?.length > 4 && (
            <span style={s.skillMore}>+{job.required_skills.length - 4} more</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        {isRecruiter ? (
          <>
            <div style={s.applicants}>
              <span style={s.applicantsNum}>{job.applicant_count ?? 0}</span>
              <span style={s.applicantsLabel}> applicant{job.applicant_count !== 1 ? 's' : ''}</span>
            </div>
            <div style={s.footerActions}>
              {job.status === 'active' && (
                <button onClick={() => onCloseJob?.(job._id)} style={s.ghostBtn}>Close</button>
              )}
              <button onClick={() => onViewRankings?.(job._id)} style={s.primaryBtn}>
                Rankings
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </>
        ) : (
          <>
            <span style={s.postedDate}>
              {job.created_at ? new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </span>
            <button
              disabled={alreadyApplied}
              onClick={() => !alreadyApplied && onApply?.(job)}
              style={alreadyApplied ? s.appliedBtn : s.primaryBtn}>
              {alreadyApplied ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Applied</>
              ) : (
                <>Apply Now <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  card: { background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s,transform 0.2s', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.25rem 0' },
  companyAvatar: { width: '42px', height: '42px', borderRadius: '11px', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 800, flexShrink: 0 },
  headerMeta: { display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  locationPill: { padding: '3px 9px', background: '#f1f5f9', color: '#475569', borderRadius: '999px', fontSize: '11px', fontWeight: 500, textTransform: 'capitalize' },
  body: { padding: '1rem 1.25rem', flex: 1 },
  title: { fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '3px', lineHeight: 1.35 },
  company: { fontSize: '13px', color: '#64748b', marginBottom: '10px' },
  location: { color: '#94a3b8' },
  tags: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' },
  tag: { fontSize: '11px', fontWeight: 500, padding: '3px 9px', background: '#f1f5f9', color: '#475569', borderRadius: '6px', textTransform: 'capitalize' },
  desc: { fontSize: '13px', color: '#64748b', lineHeight: 1.65, marginBottom: '10px' },
  skills: { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  skill: { fontSize: '11px', padding: '3px 9px', background: '#eef2ff', color: '#4f46e5', borderRadius: '6px', fontWeight: 500 },
  skillMore: { fontSize: '11px', color: '#94a3b8', alignSelf: 'center' },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 1.25rem', borderTop: '1px solid #f1f5f9', background: '#fafafa' },
  applicants: { display: 'flex', alignItems: 'baseline', gap: '2px' },
  applicantsNum: { fontSize: '17px', fontWeight: 800, color: '#0f172a' },
  applicantsLabel: { fontSize: '12px', color: '#94a3b8' },
  footerActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  appliedBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'default' },
  ghostBtn: { padding: '7px 13px', background: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  postedDate: { fontSize: '12px', color: '#94a3b8' },
};
