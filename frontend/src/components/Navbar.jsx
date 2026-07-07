import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const links = user?.role === 'candidate'
    ? [{ path: '/jobs', label: 'Browse Jobs' }, { path: '/applications', label: 'My Applications' }]
    : [{ path: '/recruiter', label: 'Dashboard' }, { path: '/recruiter/create', label: 'Post Job' }];

  const isActive = path => location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  return (
    <header style={s.header}>
      <div style={s.inner}>
        <div style={s.left}>
          <div style={s.logo} onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter' : '/jobs')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={s.brand} onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter' : '/jobs')}>TalentAI</span>

          {user && (
            <nav style={s.nav}>
              {links.map(link => (
                <button key={link.path} onClick={() => navigate(link.path)}
                  style={isActive(link.path) ? s.navLinkActive : s.navLink}>
                  {link.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        <div style={s.right}>
          {user ? (
            <>
              <div style={s.userInfo}>
                <div style={s.avatar}>{user.name?.[0]?.toUpperCase()}</div>
                <div style={s.userMeta}>
                  <span style={s.userName}>{user.name}</span>
                  <span style={s.userRole}>{user.role}</span>
                </div>
              </div>
              <div style={s.divider} />
              <button onClick={onLogout} style={s.logoutBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} style={s.signinBtn}>Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
}

const s = {
  header: { background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 100, height: '60px' },
  inner: { maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' },
  left: { display: 'flex', alignItems: 'center', gap: '0' },
  logo: { width: '32px', height: '32px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  brand: { fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', cursor: 'pointer', marginLeft: '10px', marginRight: '32px' },
  nav: { display: 'flex', alignItems: 'center', gap: '2px' },
  navLink: { padding: '6px 12px', background: 'none', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 500, color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' },
  navLinkActive: { padding: '6px 12px', background: '#eef2ff', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, color: '#4f46e5', cursor: 'pointer' },
  right: { display: 'flex', alignItems: 'center', gap: '12px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '9px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.3 },
  userRole: { fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize', lineHeight: 1.3 },
  divider: { width: '1px', height: '20px', background: '#e5e7eb' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#64748b', transition: 'all 0.15s' },
  signinBtn: { padding: '7px 16px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' },
};
