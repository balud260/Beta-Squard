const rawBase = import.meta.env.VITE_API_URL || '';
const cleanBase = rawBase ? rawBase.replace(/\/+$/, '') : '';
const API_BASE = cleanBase
  ? (cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`)
  : '/api';

/**
 * Custom fetch wrapper injecting Auth token
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('solvelink_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! Status: ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  registerGovernment: (data) => request('/auth/register-government', { method: 'POST', body: JSON.stringify(data) }),
  registerUniversity: (data) => request('/auth/register-university', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Student Integration
  submitStudentSolution: (data) => request('/students/solutions', { method: 'POST', body: JSON.stringify(data) }),
  getMyStudentSolutions: () => request('/students/solutions'),
  getStudentContributions: () => request('/students/contributions'),
  getStudentProfile: () => request('/students/profile'),

  // Problems (Client & University Scoped)
  getProblems: () => request('/problems'),
  getPublicProblems: () => request('/problems/public'),
  getRecommendedProblems: () => request('/problems/recommended'),
  getAcceptedProblems: () => request('/problems/accepted'),
  getAcceptedUniversities: (problemId) => request(`/problems/${problemId}/accepted-universities`),
  acceptProblem: (id) => request(`/problems/${id}/accept`, { method: 'POST' }),
  rejectProblem: (id, data) => request(`/problems/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  getProblemDetail: (id) => request(`/problems/${id}`),
  createProblem: (data) => request('/problems', { method: 'POST', body: JSON.stringify(data) }),
  analyzeProblem: (id) => request(`/problems/${id}/analyze`, { method: 'POST' }),
  getProblemMatches: (id) => request(`/problems/${id}/matches`),
  publishProblem: (id) => request(`/problems/${id}/publish`, { method: 'POST' }),

  // Proposals
  compareProposals: (problemId) => request(`/proposals/compare/${problemId}`),
  getMyProposals: () => request('/proposals/my-proposals'),
  submitProposal: (data) => request('/proposals', { method: 'POST', body: JSON.stringify(data) }),
  selectProposal: (id) => request(`/proposals/${id}/select`, { method: 'POST' }),
  addProposalFeedback: (id, data) => request(`/proposals/${id}/feedback`, { method: 'POST', body: JSON.stringify(data) }),

  // Projects
  getProjects: () => request('/projects'),
  getProjectDetail: (id) => request(`/projects/${id}`),
  addProjectUpdate: (id, data) => request(`/projects/${id}/updates`, { method: 'POST', body: JSON.stringify(data) }),
  deployProject: (id) => request(`/projects/${id}/deploy`, { method: 'POST' }),

  // Disasters
  getDisasters: () => request('/disasters'),
  createDisaster: (data) => request('/disasters', { method: 'POST', body: JSON.stringify(data) }),
  getDisasterDetail: (id) => request(`/disasters/${id}`),
  analyzeDisaster: (id) => request(`/disasters/${id}/analyze`, { method: 'POST' }),
  getRelocationEval: (id) => request(`/disasters/${id}/relocation-eval`),
  approveRelocationSite: (id, data) => request(`/disasters/${id}/relocation-approve`, { method: 'POST', body: JSON.stringify(data) }),

  // Hospitals
  getHospitals: () => request('/hospitals'),
  updateHospitalStatus: (id, data) => request(`/hospitals/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  acknowledgeHospitalAlert: (id) => request(`/hospitals/${id}/acknowledge`, { method: 'POST' }),

  // Volunteers & Emergency
  getVolunteerRequirements: () => request('/volunteers/requirements'),
  respondVolunteerMission: (data) => request('/volunteers/respond', { method: 'POST', body: JSON.stringify(data) }),

  // Universities
  getUniversities: () => request('/universities'),
  getUniversityDetail: (id) => request(`/universities/${id}`),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),

  // Impact
  getImpactMetrics: () => request('/impact'),

  // AI Assistant
  chatAI: (query) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ query }) }),
  queryAIAssistant: (data) => request('/ai/assistant', { method: 'POST', body: JSON.stringify(data) })
};
