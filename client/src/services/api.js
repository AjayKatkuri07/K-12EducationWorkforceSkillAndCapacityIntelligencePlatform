import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edustaff_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('edustaff_token');
      localStorage.removeItem('edustaff_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoint methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  switchRole: (targetRole) => api.post('/auth/switch-role', { targetRole }),
};

export const workersAPI = {
  getWorkers: (params) => api.get('/workers', { params }),
  getWorkerById: (id) => api.get(`/workers/${id}`),
  updateWorker: (id, data) => api.put(`/workers/${id}`, data),
  addCertification: (id, data) => api.post(`/workers/${id}/certifications`, data),
  getSkillTaxonomy: () => api.get('/workers/taxonomy'),
};

export const capacityAPI = {
  getOverview: () => api.get('/capacity/overview'),
  getForecasts: (params) => api.get('/capacity/forecasts', { params }),
  generateForecast: (data) => api.post('/capacity/forecasts/generate', data),
};

export const assignmentsAPI = {
  getAssignments: (params) => api.get('/assignments', { params }),
  getAssignmentById: (id) => api.get(`/assignments/${id}`),
  compareCandidates: (id) => api.post(`/assignments/${id}/compare`),
  assignWorker: (id, workerId) => api.post(`/assignments/${id}/assign`, { workerId }),
  overrideAssignment: (id, data) => api.post(`/assignments/${id}/override`, data),
};

export const aiAPI = {
  extractSkills: (text) => api.post('/ai/extract-skills', { text }),
  forecastCapacity: (data) => api.post('/ai/forecast', data),
  matchCandidates: (assignment) => api.post('/ai/match-candidates', { assignment }),
  getBurnoutSignals: () => api.get('/ai/burnout-signals'),
};

export const fairnessAPI = {
  getReviews: (params) => api.get('/fairness/reviews', { params }),
  submitDecision: (id, data) => api.post(`/fairness/reviews/${id}/decision`, data),
};

export const learningAPI = {
  getPaths: (params) => api.get('/learning/paths', { params }),
  enrollWorker: (data) => api.post('/learning/paths/enroll', data),
  updateProgress: (id, data) => api.patch(`/learning/paths/${id}/progress`, data),
};

export const reportsAPI = {
  getInventory: () => api.get('/reports/inventory'),
  exportCSVUrl: (reportType) => `/api/v1/reports/export/csv?reportType=${reportType}`,
};

export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
};

export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/users', data),
  updateStatus: (id, active) => api.patch(`/users/${id}/status`, { active }),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
};

export const auditAPI = {
  getLogs: (params) => api.get('/audit/logs', { params }),
  getConfig: () => api.get('/audit/config'),
  updateConfig: (data) => api.put('/audit/config', data),
};

export const seedAPI = {
  resetDatabase: () => api.post('/seed/reset'),
};

export default api;
