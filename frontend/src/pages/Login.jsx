import React, { useState } from 'react';
import { login, register } from '../services/api';

const MOCK_USERS = [
  { user_id: 'recruiter-001', name: 'Demo Recruiter', email: 'abcde', password: '12345789', role: 'recruiter', token: 'mock-token-recruiter' },
  { user_id: 'candidate-001', name: 'Demo Candidate', email: 'nandan', password: '123456789', role: 'candidate', token: 'mock-token-candidate' },
];

const FEATURES = [
  { icon: '⚡', title: 'Instant AI Ranking', desc: 'Rank candidates in seconds with hybrid RAG retrieval' },
  { icon: '🎯', title: 'Multi-Factor Scoring', desc: 'Skills, experience, education, projects — all weighted' },
  { icon: '🔍', title: 'Smart Resume Analysis', desc: 'Automated extraction and semantic understanding' },
  { icon: '📊', title: 'Real-time Pipeline', desc: 'Watch every stage of the AI process live' },
];

export function Login({ onLoginSuccess }) {
  const [tab, setTab] = useState('login');
  const [role, setRole] = useState('candidate');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const switchTab = t => { setTab(t); setError(''); setForm({ name: '', email: '', password: '', confirm: '' }); };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    try {
      const mock = MOCK_USERS.find(u => u.email === form.email.trim() && u.password === form.password);
      if (mock) {
        const userData = { ...mock };
        delete userData.password;
        localStorage.setItem('user', JSON.stringify(userData));
        onLoginSuccess(userData); return;
      }
      const res = await login(form.email.trim(), form.password);
      localStorage.setItem('user', JSON.stringify(res.data));
      onLoginSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.confirm) { setError('Please fill in all fields.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await register(form.email.trim(), form.password, role, form.name.trim());
      localStorage.setItem('user', JSON.stringify(res.data));
      onLoginSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try a different email.');
    } finally { setLoading(false); }
  };

  const onKey = fn => e => e.key === 'Enter' && fn();

  return (
    <div style={s.root}>
      {/* ── Left panel ── */}
      <div style={s.left}>
        <div style={s.leftTop}>
          <div style={s.logo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={s.logoText}>TalentAI</span>
        </div>

        <div style={s.leftBody}>
          <div style={s.leftBadge}>AI-Powered Recruitment</div>
          <h1 style={s.headline}>Hire the right people,<br />faster than ever.</h1>
          <p style={s.subtext}>From resume to ranked shortlist in minutes — powered by semantic search, multi-factor scoring, and LLM reasoning.</p>

          <div style={s.features}>
            {FEATURES.map(f => (
              <div key={f.title} style={s.featureItem}>
                <div style={s.featureIconBox}>{f.icon}</div>
                <div>
                  <div style={s.featureTitle}>{f.title}</div>
                  <div style={s.featureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.demoBlock}>
          <div style={s.demoHeader}>
            <div style={s.demoDividerLine} />
            <span style={s.demoHeaderText}>DEMO ACCESS</span>
            <div style={s.demoDividerLine} />
          </div>
          <div style={s.demoRow}>
            {[
              { label: 'Recruiter', sub: 'abcde / 12345789', icon: '👔', email: 'abcde', pw: '12345789' },
              { label: 'Candidate', sub: 'nandan / 123456789', icon: '👤', email: 'nandan', pw: '123456789' },
            ].map(d => (
              <button key={d.label} style={s.demoBtn}
                onClick={() => { setTab('login'); setForm(p => ({ ...p, email: d.email, password: d.pw })); setError(''); }}>
                <span style={s.demoBtnIcon}>{d.icon}</span>
                <div>
                  <div style={s.demoBtnLabel}>{d.label}</div>
                  <div style={s.demoBtnSub}>{d.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={s.right}>
        <div style={s.card}>
          <div style={s.tabRow}>
            {['login', 'register'].map(t => (
              <button key={t} style={tab === t ? s.tabOn : s.tabOff} onClick={() => switchTab(t)}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>{tab === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p style={s.cardSub}>{tab === 'login' ? 'Sign in to access your dashboard' : 'Join thousands of recruiters and candidates'}</p>
          </div>

          {error && (
            <div style={s.errorBanner}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {tab === 'register' && (
            <div style={s.field}>
              <label style={s.label}>I am a</label>
              <div style={s.roleGrid}>
                {[['candidate', '👤', 'Job Seeker'], ['recruiter', '👔', 'Hiring Manager']].map(([r, icon, lbl]) => (
                  <button key={r} type="button" style={{ ...s.roleCard, ...(role === r ? s.roleCardOn : {}) }} onClick={() => setRole(r)}>
                    <span style={s.roleCardIcon}>{icon}</span>
                    <span style={s.roleCardLabel}>{lbl}</span>
                    {role === r && <div style={s.roleCheck}>✓</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} placeholder="John Doe" value={form.name} onChange={set('name')} onKeyDown={onKey(handleRegister)} autoFocus />
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>{tab === 'login' ? 'Email or Username' : 'Email Address'}</label>
            <input style={s.input} type={tab === 'register' ? 'email' : 'text'}
              placeholder={tab === 'login' ? 'Enter email or username' : 'you@company.com'}
              value={form.email} onChange={set('email')}
              onKeyDown={onKey(tab === 'login' ? handleLogin : handleRegister)}
              autoFocus={tab === 'login'} />
          </div>

          <div style={s.field}>
            <div style={s.labelRow}>
              <label style={s.label}>Password</label>
            </div>
            <div style={{ position: 'relative' }}>
              <input style={s.input} type={showPass ? 'text' : 'password'}
                placeholder={tab === 'register' ? 'Minimum 6 characters' : '••••••••'}
                value={form.password} onChange={set('password')}
                onKeyDown={onKey(tab === 'login' ? handleLogin : handleRegister)} />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div style={s.field}>
              <label style={s.label}>Confirm Password</label>
              <input style={s.input} type="password" placeholder="Re-enter your password"
                value={form.confirm} onChange={set('confirm')} onKeyDown={onKey(handleRegister)} />
            </div>
          )}

          <button style={s.submitBtn} disabled={loading} onClick={tab === 'login' ? handleLogin : handleRegister}>
            {loading ? <span className="spinner" /> : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p style={s.switchLine}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span style={s.switchLink} onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}>
              {tab === 'login' ? 'Sign up free' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh', fontFamily: 'Inter,sans-serif' },
  left: { flex: 1, background: 'linear-gradient(155deg,#1e1b4b 0%,#312e81 35%,#4338ca 70%,#4f46e5 100%)', display: 'flex', flexDirection: 'column', padding: '2.5rem 3rem', color: '#fff', gap: '2rem', minWidth: 0 },
  leftTop: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { width: '38px', height: '38px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' },
  logoText: { fontSize: '18px', fontWeight: 800, letterSpacing: '-0.4px' },
  leftBody: { flex: 1 },
  leftBadge: { display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.15)' },
  headline: { fontSize: '38px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1.5px', marginBottom: '1rem' },
  subtext: { fontSize: '15px', opacity: 0.7, lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: '400px' },
  features: { display: 'flex', flexDirection: 'column', gap: '16px' },
  featureItem: { display: 'flex', alignItems: 'flex-start', gap: '14px' },
  featureIconBox: { width: '36px', height: '36px', background: 'rgba(255,255,255,0.12)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' },
  featureTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '2px' },
  featureDesc: { fontSize: '12px', opacity: 0.6, lineHeight: 1.5 },
  demoBlock: { paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' },
  demoHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  demoDividerLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.15)' },
  demoHeaderText: { fontSize: '10px', fontWeight: 700, opacity: 0.5, letterSpacing: '1.5px', whiteSpace: 'nowrap' },
  demoRow: { display: 'flex', gap: '10px' },
  demoBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', cursor: 'pointer', color: '#fff', textAlign: 'left', transition: 'background 0.2s' },
  demoBtnIcon: { fontSize: '18px' },
  demoBtnLabel: { fontSize: '12px', fontWeight: 600 },
  demoBtnSub: { fontSize: '10px', opacity: 0.55, fontFamily: 'monospace', marginTop: '1px' },

  right: { width: '480px', flexShrink: 0, background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  card: { background: '#fff', borderRadius: '20px', padding: '2.25rem', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb' },
  tabRow: { display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '2rem' },
  tabOn: { flex: 1, padding: '9px 12px', background: '#fff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 700, color: '#4f46e5', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  tabOff: { flex: 1, padding: '9px 12px', background: 'none', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 500, color: '#64748b', cursor: 'pointer' },
  cardHead: { marginBottom: '1.5rem' },
  cardTitle: { fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' },
  cardSub: { fontSize: '13px', color: '#94a3b8' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 500, marginBottom: '1.25rem' },
  field: { marginBottom: '1rem' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: '9px', fontSize: '14px', color: '#0f172a', background: '#fafafa', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' },
  eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  roleCard: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '9px', background: '#fafafa', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' },
  roleCardOn: { border: '1.5px solid #6366f1', background: '#eef2ff' },
  roleCardIcon: { fontSize: '18px' },
  roleCardLabel: { fontSize: '13px', fontWeight: 600, color: '#374151' },
  roleCheck: { position: 'absolute', top: '6px', right: '8px', width: '16px', height: '16px', background: '#6366f1', borderRadius: '50%', color: '#fff', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  submitBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem', marginBottom: '1.25rem', letterSpacing: '0.2px' },
  switchLine: { textAlign: 'center', fontSize: '13px', color: '#94a3b8' },
  switchLink: { color: '#4f46e5', fontWeight: 700, cursor: 'pointer' },
};
