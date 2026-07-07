import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRankings, getResumeUrl } from '../services/api';

const ScoreBar = ({ value, color, label }) => (
  <div style={{ marginBottom: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
      <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{Math.round(value * 100)}%</span>
    </div>
    <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.round(value * 100)}%`, background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
    </div>
  </div>
);

const StatChip = ({ label, value, color = '#6366f1', bg = '#eef2ff' }) => (
  <div style={{ padding: '6px 12px', background: bg, borderRadius: '8px', textAlign: 'center', minWidth: '80px' }}>
    <div style={{ fontSize: '13px', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px', fontWeight: 500 }}>{label}</div>
  </div>
);

export function Rankings({ jobId, onClose }) {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getRankings(jobId, 10)
      .then(r => setRankings(r.data))
      .catch(() => setError('Failed to load rankings'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const downloadCSV = () => {
    const headers = ['Rank', 'Name', 'Email', 'Phone', 'Qualification', 'Stream', 'Experience', 'Year Passout', 'Skill', 'Career', 'Education', 'Qualification Score', 'Projects', 'Behavior', 'Semantic', 'Penalty', 'Final Score', 'Reason'];
    const rows = rankings.map((r, i) => [
      i + 1, r.candidate_name, r.email, r.phone,
      r.qualification, r.stream, r.total_experience, r.year_of_passout,
      r.skill_score, r.career_score, r.education_score, r.qualification_score,
      r.project_score, r.behavior_score, r.semantic_score,
      r.penalty_score, r.final_score, `"${r.reason}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `rankings_${jobId}.csv`;
    a.click();
  };

  const getRankStyle = (idx) => {
    if (idx === 0) return { bg: '#fef3c7', color: '#92400e', label: '🥇' };
    if (idx === 1) return { bg: '#f1f5f9', color: '#374151', label: '🥈' };
    if (idx === 2) return { bg: '#fff7ed', color: '#78350f', label: '🥉' };
    return { bg: '#f9fafb', color: '#6b7280', label: `#${idx + 1}` };
  };

  const getScoreColor = (score) => {
    if (score >= 0.70) return '#10b981';
    if (score >= 0.50) return '#f59e0b';
    return '#ef4444';
  };

  const getFitLabel = (score) => {
    if (score >= 0.70) return { label: 'Strong Fit', color: '#10b981', bg: '#d1fae5' };
    if (score >= 0.55) return { label: 'Moderate Fit', color: '#d97706', bg: '#fef3c7' };
    if (score >= 0.40) return { label: 'Weak Fit', color: '#ea580c', bg: '#ffedd5' };
    return { label: 'Poor Fit', color: '#dc2626', bg: '#fee2e2' };
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <div>
            <h2 style={s.pageTitle}>AI Candidate Rankings</h2>
            <p style={s.pageSubtitle}>Multi-factor scoring: Skills · Experience · Education · Projects · Qualifications</p>
          </div>
          <div style={s.headerActions}>
            {rankings.length > 0 && <button onClick={downloadCSV} style={s.csvBtn}>⬇ Export CSV</button>}
            <button onClick={onClose || (() => navigate('/recruiter'))} style={s.closeBtn}>← Back to Jobs</button>
          </div>
        </div>

        {loading ? (
          <div style={s.stateCard}>
            <div style={s.spinner} />
            <p style={s.stateTitle}>Running AI Analysis...</p>
            <p style={s.stateSub}>Processing resumes with hybrid RAG retrieval and multi-factor scoring</p>
          </div>
        ) : error ? (
          <div style={s.stateCard}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <p style={s.stateTitle}>{error}</p>
            <p style={s.stateSub}>Make sure the backend is running and connected to MongoDB</p>
          </div>
        ) : rankings.length === 0 ? (
          <div style={s.stateCard}>
            <span style={{ fontSize: '48px' }}>📭</span>
            <p style={s.stateTitle}>No candidates yet</p>
            <p style={s.stateSub}>Rankings will appear once candidates apply for this job</p>
          </div>
        ) : (
          <div style={s.rankList}>
            {rankings.map((r, idx) => {
              const rankStyle = getRankStyle(idx);
              const scoreColor = getScoreColor(r.final_score);
              const fit = getFitLabel(r.final_score);
              const isExpanded = expanded === idx;
              return (
                <div key={idx} style={{ ...s.rankCard, borderLeft: `4px solid ${scoreColor}` }}>
                  {/* Collapsed Row */}
                  <div style={s.rankRow} onClick={() => setExpanded(isExpanded ? null : idx)}>
                    <div style={{ ...s.rankBadge, background: rankStyle.bg, color: rankStyle.color }}>
                      {rankStyle.label}
                    </div>

                    <div style={s.candidateInfo}>
                      <div style={s.avatar}>{r.candidate_name?.[0]?.toUpperCase()}</div>
                      <div>
                        <p style={s.candidateName}>{r.candidate_name}</p>
                        <p style={s.candidateMeta}>{r.email} · {r.phone}</p>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                          <span style={{ ...s.fitBadge, background: fit.bg, color: fit.color }}>{fit.label}</span>
                          {r.qualification && <span style={s.infoBadge}>{r.qualification}</span>}
                          {r.stream && <span style={s.infoBadge}>{r.stream}</span>}
                          {r.total_experience > 0 && <span style={s.infoBadge}>{r.total_experience}y exp</span>}
                          {r.year_of_passout > 0 && <span style={s.infoBadge}>Passout {r.year_of_passout}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Score bars - compact */}
                    <div style={s.scoreGrid}>
                      {[
                        { label: 'Skills', value: r.skill_score, color: '#6366f1' },
                        { label: 'Experience', value: r.career_score, color: '#3b82f6' },
                        { label: 'Education', value: r.education_score, color: '#f59e0b' },
                        { label: 'Projects', value: r.project_score ?? 0, color: '#8b5cf6' },
                      ].map(sc => (
                        <div key={sc.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>{sc.label}</span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#374151' }}>{Math.round(sc.value * 100)}%</span>
                          </div>
                          <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round(sc.value * 100)}%`, background: sc.color, borderRadius: '3px' }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={s.finalScoreWrap}>
                      <div style={{ ...s.finalScoreCircle, background: scoreColor }}>
                        {Math.round(r.final_score * 100)}
                      </div>
                      <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>Score</span>
                    </div>

                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded Panel */}
                  {isExpanded && (
                    <div style={s.expandPanel}>
                      {/* Overview stats row */}
                      <div style={s.statsRow}>
                        <StatChip label="Experience" value={`${r.total_experience}y`} color="#3b82f6" bg="#eff6ff" />
                        <StatChip label="Passout" value={r.year_of_passout || '—'} color="#6366f1" bg="#eef2ff" />
                        <StatChip label="Qualification" value={r.qualification || '—'} color="#7c3aed" bg="#f5f3ff" />
                        <StatChip label="Stream" value={r.stream ? r.stream.split(' ')[0] : '—'} color="#0891b2" bg="#ecfeff" />
                        {r.employment_gap && <StatChip label="Emp. Gap" value="⚠ Yes" color="#dc2626" bg="#fee2e2" />}
                      </div>

                      <div style={s.panelGrid}>
                        {/* Left: All scores */}
                        <div style={s.panelLeft}>
                          <p style={s.panelSectionLabel}>Score Breakdown</p>
                          <ScoreBar label="Skill Match" value={r.skill_score} color="#6366f1" />
                          <ScoreBar label="Experience Fit" value={r.career_score} color="#3b82f6" />
                          <ScoreBar label="Education" value={r.education_score} color="#f59e0b" />
                          <ScoreBar label="Qualification" value={r.qualification_score ?? 0} color="#7c3aed" />
                          <ScoreBar label="Project Relevance" value={r.project_score ?? 0} color="#8b5cf6" />
                          <ScoreBar label="Behavioral Signals" value={r.behavior_score} color="#10b981" />
                          <ScoreBar label="Semantic Fit" value={r.semantic_score} color="#6366f1" />
                          <ScoreBar label="Additional Req." value={r.additional_req_score ?? 1} color="#0891b2" />
                        </div>

                        {/* Right: Skills + AI reason */}
                        <div style={s.panelRight}>
                          {/* Matched skills */}
                          {r.matched_skills?.length > 0 && (
                            <div style={s.panelBlock}>
                              <p style={s.panelSectionLabel}>✅ Matched Skills</p>
                              <div style={s.tagRow}>
                                {r.matched_skills.map(sk => (
                                  <span key={sk} style={{ ...s.skillTag, background: '#d1fae5', color: '#065f46' }}>{sk}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Missing skills */}
                          {r.missing_skills?.length > 0 && (
                            <div style={s.panelBlock}>
                              <p style={s.panelSectionLabel}>❌ Missing Skills</p>
                              <div style={s.tagRow}>
                                {r.missing_skills.map(sk => (
                                  <span key={sk} style={{ ...s.skillTag, background: '#fee2e2', color: '#b91c1c' }}>{sk}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Gap note */}
                          {r.gap_note && (
                            <div style={{ ...s.panelBlock, background: '#fff7ed', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                              <p style={{ fontSize: '12px', color: '#c2410c', fontWeight: 600 }}>⚠ {r.gap_note}</p>
                            </div>
                          )}

                          {/* AI Reasoning */}
                          <div style={s.panelBlock}>
                            <p style={s.panelSectionLabel}>🤖 AI Summary</p>
                            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, background: '#f9fafb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>{r.reason}</p>
                          </div>

                          {/* Actions */}
                          <div style={s.actionRow}>
                            {r.penalty_score > 0 && (
                              <span style={s.penaltyBadge}>⚠ Penalty: {Math.round(r.penalty_score * 100)}%</span>
                            )}
                            {r.resume_path && (
                              <a href={getResumeUrl(jobId, r.email)} target="_blank" rel="noopener noreferrer" style={s.resumeBtn}>
                                📄 View Resume
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { background: '#f0f2f8', minHeight: 'calc(100vh - 64px)', padding: '2rem 1.5rem' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' },
  pageTitle: { fontSize: '24px', fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' },
  pageSubtitle: { fontSize: '13px', color: '#9ca3af', marginTop: '4px' },
  headerActions: { display: 'flex', gap: '10px' },
  csvBtn: { padding: '9px 18px', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' },
  closeBtn: { padding: '9px 18px', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#6366f1' },
  stateCard: { background: 'white', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  spinner: { width: '44px', height: '44px', border: '4px solid #e5e7eb', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' },
  stateTitle: { fontSize: '18px', fontWeight: 600, color: '#374151' },
  stateSub: { fontSize: '14px', color: '#9ca3af' },
  rankList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  rankCard: { background: 'white', borderRadius: '14px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' },
  rankRow: { display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem', cursor: 'pointer' },
  rankBadge: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, flexShrink: 0 },
  candidateInfo: { display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: '220px' },
  avatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0, marginTop: '2px' },
  candidateName: { fontSize: '14px', fontWeight: 700, color: '#111827' },
  candidateMeta: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' },
  fitBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 },
  infoBadge: { padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: '4px', fontSize: '10px', fontWeight: 500 },
  scoreGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 1.5rem', flex: 1 },
  finalScoreWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 },
  finalScoreCircle: { width: '52px', height: '52px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800 },
  expandPanel: { padding: '1.25rem 1.5rem 1.5rem', background: '#fafafa', borderTop: '1px solid #f3f4f6' },
  statsRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.25rem' },
  panelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  panelLeft: {},
  panelRight: { display: 'flex', flexDirection: 'column', gap: '12px' },
  panelSectionLabel: { fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  panelBlock: {},
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  skillTag: { fontSize: '11px', padding: '3px 10px', borderRadius: '5px', fontWeight: 600 },
  actionRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '4px' },
  penaltyBadge: { padding: '5px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '12px', fontWeight: 600 },
  resumeBtn: { padding: '6px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', border: '1px solid #bfdbfe' },
};
