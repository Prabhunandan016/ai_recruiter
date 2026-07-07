import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../services/api';

const QUALIFICATIONS = ['B.Tech', 'B.E', 'BCA', 'B.Sc', 'M.Tech', 'M.E', 'MCA', 'MBA', 'M.Sc', 'PhD', 'Diploma', 'Any'];
const STREAMS = ['Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Data Science', 'AI/ML', 'MBA Finance', 'MBA Marketing', 'Any'];

export function CreateJob({ user, onJobCreated }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', company: '', company_location: '', work_location: 'on-site',
    job_type: 'full-time', required_qualifications: [], required_streams: [],
    exp_min: '0', exp_max: '3',
    description: '', required_skills: '', preferred_skills: '',
    behavioral_requirements: '', additional_requirements: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleMulti = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(form.exp_min) > parseFloat(form.exp_max)) {
      setError('Minimum experience cannot exceed maximum experience.');
      return;
    }
    setLoading(true); setError('');
    try {
      await createJob({
        recruiter_id: user.user_id,
        title: form.title,
        company: form.company,
        company_location: form.company_location,
        work_location: form.work_location,
        job_type: form.job_type,
        required_qualifications: form.required_qualifications,
        required_streams: form.required_streams,
        exp_min: parseFloat(form.exp_min) || 0,
        exp_max: parseFloat(form.exp_max) || 3,
        job_description: form.description,
        required_skills: form.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        preferred_skills: form.preferred_skills.split(',').map(s => s.trim()).filter(Boolean),
        behavioral_requirements: form.behavioral_requirements.split(',').map(s => s.trim()).filter(Boolean),
        additional_requirements: form.additional_requirements,
      });
      onJobCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.pageHeader}>
          <h2 style={s.pageTitle}>Post a New Job</h2>
          <p style={s.pageSubtitle}>Fill in the details to attract and rank the best candidates</p>
        </div>

        {error && <div style={s.errorBox}><span>⚠</span> {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Company Info */}
          <div style={s.section}>
            <h3 style={s.sectionTitle}><span style={s.sectionNum}>1</span> Company & Role</h3>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Job Title *</label>
                <input style={s.input} placeholder="e.g. Senior Backend Engineer" value={form.title} onChange={set('title')} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Company Name *</label>
                <input style={s.input} placeholder="e.g. TechCorp Inc." value={form.company} onChange={set('company')} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Company Location *</label>
                <input style={s.input} placeholder="e.g. Bangalore, India" value={form.company_location} onChange={set('company_location')} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Work Location</label>
                <select style={s.input} value={form.work_location} onChange={set('work_location')}>
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Job Type</label>
                <select style={s.input} value={form.job_type} onChange={set('job_type')}>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Qualification */}
          <div style={s.section}>
            <h3 style={s.sectionTitle}><span style={s.sectionNum}>2</span> Qualification Requirements</h3>

            <div style={s.field}>
              <label style={s.label}>Required Qualification(s)</label>
              <p style={s.hint}>Select all that are acceptable</p>
              <div style={s.chipGrid}>
                {QUALIFICATIONS.map(q => (
                  <button key={q} type="button"
                    style={{ ...s.chip, ...(form.required_qualifications.includes(q) ? s.chipActive : {}) }}
                    onClick={() => toggleMulti('required_qualifications', q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Preferred Stream / Specialization</label>
              <p style={s.hint}>Select all relevant streams</p>
              <div style={s.chipGrid}>
                {STREAMS.map(st => (
                  <button key={st} type="button"
                    style={{ ...s.chip, ...(form.required_streams.includes(st) ? s.chipActive : {}) }}
                    onClick={() => toggleMulti('required_streams', st)}>
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Minimum Experience (years) *</label>
                <input style={s.input} type="number" min="0" max="30" step="0.5"
                  placeholder="e.g. 2" value={form.exp_min} onChange={set('exp_min')} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Maximum Experience (years) *</label>
                <input style={s.input} type="number" min="0" max="30" step="0.5"
                  placeholder="e.g. 5" value={form.exp_max} onChange={set('exp_max')} required />
                <p style={s.hint}>Candidates outside this range will be scored lower</p>
              </div>
            </div>
          </div>

          {/* Section 3: Job Description */}
          <div style={s.section}>
            <h3 style={s.sectionTitle}><span style={s.sectionNum}>3</span> Job Description</h3>
            <div style={s.field}>
              <label style={s.label}>Description *</label>
              <textarea style={{ ...s.input, minHeight: '150px', resize: 'vertical', lineHeight: 1.7 }}
                placeholder="Describe the role, responsibilities, team, and what makes this opportunity exciting..."
                value={form.description} onChange={set('description')} required />
            </div>
          </div>

          {/* Section 4: Skills */}
          <div style={s.section}>
            <h3 style={s.sectionTitle}><span style={s.sectionNum}>4</span> Skills & Requirements</h3>
            <div style={s.field}>
              <label style={s.label}>Required Skills *</label>
              <input style={s.input} placeholder="Python, React, MongoDB  (comma-separated)"
                value={form.required_skills} onChange={set('required_skills')} required />
              <p style={s.hint}>These are used for skill match scoring</p>
            </div>
            <div style={s.field}>
              <label style={s.label}>Preferred Skills</label>
              <input style={s.input} placeholder="Docker, Kubernetes, GraphQL  (comma-separated)"
                value={form.preferred_skills} onChange={set('preferred_skills')} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Behavioral / Soft Skills</label>
              <input style={s.input} placeholder="leadership, teamwork, communication  (comma-separated)"
                value={form.behavioral_requirements} onChange={set('behavioral_requirements')} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Additional Requirements</label>
              <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Any other specific requirements (certifications, domain knowledge, work authorization, etc.)"
                value={form.additional_requirements} onChange={set('additional_requirements')} />
            </div>
          </div>

          <div style={s.formFooter}>
            <button type="button" onClick={() => navigate('/recruiter')} style={s.cancelBtn}>← Back</button>
            <button type="submit" style={s.submitBtn} disabled={loading}>
              {loading ? <><span className="spinner" /> Publishing...</> : '🚀 Publish Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: { background: '#f0f2f8', minHeight: 'calc(100vh - 64px)', padding: '2rem 1.5rem' },
  container: { maxWidth: '800px', margin: '0 auto' },
  pageHeader: { marginBottom: '2rem' },
  pageTitle: { fontSize: '24px', fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' },
  pageSubtitle: { fontSize: '14px', color: '#9ca3af', marginTop: '4px' },
  errorBox: { background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' },
  section: { background: 'white', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.25rem', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' },
  sectionNum: { width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', background: '#fafafa', fontFamily: 'inherit', boxSizing: 'border-box' },
  hint: { fontSize: '12px', color: '#9ca3af', marginTop: '4px' },
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' },
  chip: { padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #e5e7eb', background: 'white', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' },
  chipActive: { background: '#eef2ff', borderColor: '#6366f1', color: '#4f46e5', fontWeight: 700 },
  formFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '0.5rem' },
  cancelBtn: { padding: '11px 24px', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#6b7280' },
  submitBtn: { padding: '11px 28px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' },
};
