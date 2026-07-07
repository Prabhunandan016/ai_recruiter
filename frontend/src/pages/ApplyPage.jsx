import React, { useState } from 'react';
import { applyForJob } from '../services/api';

const QUALIFICATIONS = ['B.Tech', 'B.E', 'BCA', 'B.Sc', 'M.Tech', 'M.E', 'MCA', 'MBA', 'M.Sc', 'PhD', 'Diploma', 'Other'];
const STREAMS = ['Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Data Science', 'AI/ML', 'MBA Finance', 'MBA Marketing', 'Other'];

export function ApplyPage({ user, job, onApplySuccess }) {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: '',
    qualification: '',
    stream: '',
    total_experience: '',
    year_of_passout: '',
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) { setError('Please upload your resume (PDF)'); return; }
    setLoading(true); setError('');
    try {
      await applyForJob(
        user.user_id, job._id,
        form.name, form.email, form.phone,
        form.qualification, form.stream,
        parseFloat(form.total_experience) || 0,
        parseInt(form.year_of_passout) || 0,
        resume,
      );
      setSuccess(true);
      setTimeout(onApplySuccess, 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={s.successPage}>
      <div style={s.successCard}>
        <div style={{ fontSize: '56px', marginBottom: '1rem' }}>🎉</div>
        <h2 style={s.successTitle}>Application Submitted!</h2>
        <p style={s.successText}>Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been submitted.</p>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.5rem' }}>Redirecting...</p>
        <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', animation: 'pulse 2s ease-in-out' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.layout}>
        {/* Job Summary Sidebar */}
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <div style={s.sidebarIcon}>{job.company?.[0]?.toUpperCase()}</div>
            <div>
              <h3 style={s.sidebarTitle}>{job.title}</h3>
              <p style={s.sidebarCompany}>{job.company}</p>
            </div>
          </div>
          <div style={s.metaList}>
            {job.company_location && <div style={s.metaRow}><span>📍</span><span>{job.company_location}</span></div>}
            {job.work_location && <div style={s.metaRow}><span>🏢</span><span style={{ textTransform: 'capitalize' }}>{job.work_location}</span></div>}
            <div style={s.metaRow}><span>💼</span><span style={{ textTransform: 'capitalize' }}>{job.job_type}</span></div>
            {(job.exp_min !== undefined && job.exp_max !== undefined) && (
              <div style={s.metaRow}><span>📅</span><span>{job.exp_min}–{job.exp_max} years experience</span></div>
            )}
          </div>
          {job.required_qualifications?.length > 0 && (
            <div style={s.sidebarSection}>
              <p style={s.sidebarSectionLabel}>Required Qualification</p>
              <div style={s.tagRow}>{job.required_qualifications.map(q => <span key={q} style={s.tag}>{q}</span>)}</div>
            </div>
          )}
          {job.required_streams?.length > 0 && (
            <div style={s.sidebarSection}>
              <p style={s.sidebarSectionLabel}>Preferred Stream</p>
              <div style={s.tagRow}>{job.required_streams.map(st => <span key={st} style={{ ...s.tag, background: '#f0fdf4', color: '#16a34a' }}>{st}</span>)}</div>
            </div>
          )}
          {job.required_skills?.length > 0 && (
            <div style={s.sidebarSection}>
              <p style={s.sidebarSectionLabel}>Required Skills</p>
              <div style={s.tagRow}>{job.required_skills.map(sk => <span key={sk} style={{ ...s.tag, background: '#eef2ff', color: '#4f46e5' }}>{sk}</span>)}</div>
            </div>
          )}
          <div style={s.sidebarSection}>
            <p style={s.sidebarSectionLabel}>About the Role</p>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>{job.job_description}</p>
          </div>
        </div>

        {/* Application Form */}
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Your Application</h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '1.5rem' }}>Complete all fields — they are used for AI ranking</p>

          {error && <div style={s.errorBox}><span>⚠</span> {error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Personal Info */}
            <div style={s.formSection}>
              <p style={s.formSectionLabel}>Personal Information</p>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Full Name *</label>
                  <input style={s.input} value={form.name} onChange={set('name')} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Email *</label>
                  <input style={s.input} type="email" value={form.email} onChange={set('email')} required />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Phone Number *</label>
                <input style={s.input} type="tel" placeholder="+91 9999999999" value={form.phone} onChange={set('phone')} required />
              </div>
            </div>

            {/* Academic Info */}
            <div style={s.formSection}>
              <p style={s.formSectionLabel}>Academic Background</p>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Highest Qualification *</label>
                  <select style={s.input} value={form.qualification} onChange={set('qualification')} required>
                    <option value="">Select qualification</option>
                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Stream / Specialization *</label>
                  <select style={s.input} value={form.stream} onChange={set('stream')} required>
                    <option value="">Select stream</option>
                    {STREAMS.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Year of Passing *</label>
                <input style={s.input} type="number" min="1990" max="2030"
                  placeholder="e.g. 2022" value={form.year_of_passout} onChange={set('year_of_passout')} required />
              </div>
            </div>

            {/* Experience */}
            <div style={s.formSection}>
              <p style={s.formSectionLabel}>Work Experience</p>
              <div style={s.field}>
                <label style={s.label}>Total Experience (years) *</label>
                <input style={s.input} type="number" min="0" max="50" step="0.5"
                  placeholder="e.g. 3.5" value={form.total_experience} onChange={set('total_experience')} required />
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Enter 0 if fresher</p>
              </div>
            </div>

            {/* Resume Upload */}
            <div style={s.field}>
              <label style={s.label}>Resume (PDF) *</label>
              <label style={s.uploadArea}>
                <input type="file" accept=".pdf" onChange={e => setResume(e.target.files[0])} style={{ display: 'none' }} />
                {resume ? (
                  <div style={s.uploadSelected}>
                    <span style={{ fontSize: '28px' }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{resume.name}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{(resume.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>Change</span>
                  </div>
                ) : (
                  <div style={s.uploadPlaceholder}>
                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>☁</span>
                    <p style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}><strong>Click to upload</strong> your resume</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>PDF only · max 10MB</p>
                  </div>
                )}
              </label>
            </div>

            <button type="submit" style={s.submitBtn} disabled={loading}>
              {loading ? <><span className="spinner" /> Submitting...</> : 'Submit Application →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' },
  layout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' },
  sidebar: { background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'sticky', top: '80px' },
  sidebarHeader: { display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '1.25rem' },
  sidebarIcon: { width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, flexShrink: 0 },
  sidebarTitle: { fontSize: '16px', fontWeight: 700, color: '#111827' },
  sidebarCompany: { fontSize: '13px', color: '#6b7280', marginTop: '2px' },
  metaList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f3f4f6' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' },
  sidebarSection: { marginBottom: '1.1rem' },
  sidebarSectionLabel: { fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' },
  tagRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tag: { fontSize: '12px', padding: '3px 10px', background: '#f3f4f6', color: '#374151', borderRadius: '6px', fontWeight: 500 },
  formCard: { background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  formTitle: { fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' },
  formSection: { marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f3f4f6' },
  formSectionLabel: { fontSize: '12px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' },
  errorBox: { background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', background: '#fafafa', fontFamily: 'inherit', boxSizing: 'border-box' },
  uploadArea: { display: 'block', border: '2px dashed #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: '#fafafa' },
  uploadPlaceholder: { padding: '2rem', textAlign: 'center' },
  uploadSelected: { display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem 1.25rem' },
  submitBtn: { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem' },
  successPage: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' },
  successCard: { background: 'white', borderRadius: '20px', padding: '3rem', textAlign: 'center', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' },
  successTitle: { fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' },
  successText: { fontSize: '15px', color: '#6b7280', lineHeight: 1.6, marginBottom: '0.5rem' },
};
