import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE,
});

// Attach token to every request if available
apiClient.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Auth
export const register = (email, password, role, name) =>
  apiClient.post('/register', { email, password, role, name });

export const login = (email, password) =>
  apiClient.post('/login', { email, password });

// Candidate
export const getJobs = () => apiClient.get('/jobs');

export const hasApplied = (job_id, candidate_id) =>
  apiClient.get(`/jobs/${job_id}/has-applied/${candidate_id}`);

export const applyForJob = (candidate_id, job_id, name, email, phone, qualification, stream, total_experience, year_of_passout, resume) => {
  const formData = new FormData();
  formData.append('candidate_id', candidate_id);
  formData.append('job_id', job_id);
  formData.append('name', name);
  formData.append('email', email);
  formData.append('phone', phone);
  formData.append('qualification', qualification);
  formData.append('stream', stream);
  formData.append('total_experience', total_experience);
  formData.append('year_of_passout', year_of_passout);
  formData.append('resume', resume);
  return apiClient.post('/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getMyApplications = (candidate_id) =>
  apiClient.get(`/applications/${candidate_id}`);

// Recruiter
export const createJob = (data) => apiClient.post('/create-job', data);

export const getRecruiterJobs = (recruiter_id) =>
  apiClient.get(`/recruiter-jobs/${recruiter_id}`);

export const getJob = (job_id) => apiClient.get(`/job/${job_id}`);

export const updateJobStatus = (job_id, status) =>
  apiClient.patch(`/job/${job_id}/status`, { status });

export const getApplicants = (job_id) => apiClient.get(`/job/${job_id}/applicants`);

export const updateApplicationStatus = (application_id, status) =>
  apiClient.patch(`/application/${application_id}/status`, { status });

export const getRankings = (job_id, top_k = 10) =>
  apiClient.post(`/rank/${job_id}?top_k=${top_k}`);

export const getResumeUrl = (job_id, email) =>
  `${API_BASE}/resume/${job_id}/${encodeURIComponent(email)}`;
