import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { ApplyPage } from './pages/ApplyPage';
import { MyApplications } from './pages/MyApplications';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { CreateJob } from './pages/CreateJob';
import { Rankings } from './pages/Rankings';

// ── Auth guard ──────────────────────────────────────────────────────────────
function RequireAuth({ user, children, role }) {
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

// ── Apply wrapper (reads jobId from URL, job data from location state) ──────
function ApplyWrapper({ user, jobs, onApplySuccess }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const job = jobs.find(j => j._id === jobId);
  if (!job) return <Navigate to="/jobs" replace />;
  return (
    <ApplyPage
      user={user}
      job={job}
      onApplySuccess={() => { onApplySuccess(); navigate('/applications'); }}
    />
  );
}

// ── Rankings wrapper ─────────────────────────────────────────────────────────
function RankingsWrapper() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  return <Rankings jobId={jobId} onClose={() => navigate('/recruiter')} />;
}

// ── Inner app (has user) ─────────────────────────────────────────────────────
function AppRoutes({ user, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

  const isRecruiter = user.role === 'recruiter';

  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <main>
        <Routes>
          {/* Root redirect by role */}
          <Route path="/" element={<Navigate to={isRecruiter ? '/recruiter' : '/jobs'} replace />} />
          <Route path="/login" element={<Navigate to={isRecruiter ? '/recruiter' : '/jobs'} replace />} />

          {/* ── Recruiter routes ── */}
          <Route path="/recruiter" element={
            <RequireAuth user={user} role="recruiter">
              <RecruiterDashboard
                user={user}
                onCreateJob={() => navigate('/recruiter/create')}
                onViewRankings={(jobId) => navigate(`/recruiter/rankings/${jobId}`)}
              />
            </RequireAuth>
          } />
          <Route path="/recruiter/create" element={
            <RequireAuth user={user} role="recruiter">
              <CreateJob user={user} onJobCreated={() => navigate('/recruiter')} />
            </RequireAuth>
          } />
          <Route path="/recruiter/rankings/:jobId" element={
            <RequireAuth user={user} role="recruiter">
              <RankingsWrapper />
            </RequireAuth>
          } />

          {/* ── Candidate routes ── */}
          <Route path="/jobs" element={
            <RequireAuth user={user} role="candidate">
              <CandidateDashboard user={user} onApply={(job) => {
                setJobs(prev => {
                  const exists = prev.find(j => j._id === job._id);
                  return exists ? prev : [...prev, job];
                });
                navigate(`/jobs/apply/${job._id}`);
              }} />
            </RequireAuth>
          } />
          <Route path="/jobs/apply/:jobId" element={
            <RequireAuth user={user} role="candidate">
              <ApplyWrapper user={user} jobs={jobs} onApplySuccess={() => {}} />
            </RequireAuth>
          } />
          <Route path="/applications" element={
            <RequireAuth user={user} role="candidate">
              <MyApplications user={user} />
            </RequireAuth>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user
            ? <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/jobs'} replace />
            : <>
                <Navbar user={null} onLogout={handleLogout} />
                <Login onLoginSuccess={handleLoginSuccess} />
              </>
        } />
        <Route path="*" element={
          user
            ? <AppRoutes user={user} onLogout={handleLogout} />
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
