const rawBase = import.meta.env.VITE_API_URL || '';
const cleanBase = rawBase ? rawBase.replace(/\/+$/, '') : '';

// Resolve API_BASE dynamically for production vs development
function getApiBase() {
  if (cleanBase) {
    return cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;
  }
  
  // If in browser and on production host (Vercel) without VITE_API_URL set,
  // fallback to deployed Render backend URL or relative /api
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // If VITE_API_URL wasn't provided at build time on Vercel, check window config or default relative /api
    return window.location.origin.endsWith('/api') ? window.location.origin : `${window.location.origin}/api`;
  }

  return '/api';
}

const API_BASE = getApiBase();

/**
 * Custom fetch wrapper with AbortController timeout and Auth token injection
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

  // Configure 12-second request timeout controller to prevent infinite "Signing in..." state
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 12000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    const contentType = response.headers.get('content-type') || '';
    let data = {};

    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    }

    if (!response.ok) {
      const errorMsg = data.error || data.message || `HTTP error! Status: ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Unable to connect to server. Request timed out. Please try again.');
    }
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Network error. Unable to reach authentication server.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
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

  // Problems (Client, University & Government Responsibility Scoped)
  getProblems: () => request('/problems'),
  getResponsibleProblems: () => request('/problems/responsible'),
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
  submitGovernmentReview: (id, data) => request(`/problems/${id}/government-review`, { method: 'POST', body: JSON.stringify(data) }),
  updateProblemRouting: (id, data) => request(`/problems/${id}/routing`, { method: 'PATCH', body: JSON.stringify(data) }),

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

  // Emergency Response Workflow APIs
  getActiveEmergencyRequests: () => request('/university/emergency/active'),
  getEligibleStudents: (incidentId) => request(`/university/emergency/${incidentId}/eligible-students`),
  notifyEmergencyStudents: (incidentId, data) => request(`/university/emergency/${incidentId}/notify`, { method: 'POST', body: JSON.stringify(data) }),
  getDisasterResponseStatus: (incidentId) => request(`/disasters/${incidentId}/response`),

  // Universities
  getUniversities: () => request('/universities'),
  getUniversityDetail: (id) => request(`/universities/${id}`),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),

  // Impact
  getImpactMetrics: () => request('/impact'),

  // Centralized AI Service Endpoints
  chatAI: (query) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ query }) }),
  queryAIAssistant: (data) => request('/ai/assistant', { method: 'POST', body: JSON.stringify(data) }),
  analyzeTeamSkillGap: (data) => request('/ai/team-skill-gap', { method: 'POST', body: JSON.stringify(data) }),
  analyzeProposals: (data) => request('/ai/proposal-analysis', { method: 'POST', body: JSON.stringify(data) }),
  getImpactAIAnalysis: () => request('/ai/impact-analysis')
};
