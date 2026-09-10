const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('verve_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

export const authAPI = {
  login: (credentials) =>
    apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => apiClient('/auth/me'),
  changePassword: (data) =>
    apiClient('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getPublicStats: () => apiClient('/auth/stats'),
};


export const adminAPI = {
  getDashboard: () => apiClient('/admin/dashboard'),
};

export const memberAPI = {
  getMembers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/admin/members${query ? `?${query}` : ''}`);
  },
  createMember: (memberData) =>
    apiClient('/admin/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    }),
  updateMember: (id, memberData) =>
    apiClient(`/admin/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    }),
  deleteMember: (id) =>
    apiClient(`/admin/members/${id}`, {
      method: 'DELETE',
    }),
};

export const projectAPI = {
  getProjects: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/admin/projects${query ? `?${query}` : ''}`);
  },
  createProject: (data) =>
    apiClient('/admin/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id, data) =>
    apiClient(`/admin/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id) =>
    apiClient(`/admin/projects/${id}`, {
      method: 'DELETE',
    }),
};

export const teamAPI = {
  getTeams: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/admin/teams${query ? `?${query}` : ''}`);
  },
  getTeamOptions: () => apiClient('/admin/teams/options'),
  createTeam: (data) =>
    apiClient('/admin/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTeam: (id, data) =>
    apiClient(`/admin/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTeam: (id) =>
    apiClient(`/admin/teams/${id}`, {
      method: 'DELETE',
    }),
};

export const taskAPI = {
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/admin/tasks${query ? `?${query}` : ''}`);
  },
  getTaskOptions: () => apiClient('/admin/tasks/options'),
  createTask: (data) =>
    apiClient('/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id, data) =>
    apiClient(`/admin/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateTaskStatus: (id, status) =>
    apiClient(`/admin/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteTask: (id) =>
    apiClient(`/admin/tasks/${id}`, {
      method: 'DELETE',
    }),
};

export const activityAPI = {
  getActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/admin/activities${query ? `?${query}` : ''}`);
  },
};

export const settingsAPI = {
  getClubProfile: () => apiClient('/admin/settings/club-profile'),
  updateClubProfile: (data) =>
    apiClient('/admin/settings/club-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getDataStats: () => apiClient('/admin/settings/data-stats'),
  exportClubData: () => apiClient('/admin/settings/export'),
};

export const leadAPI = {
  getDashboard: () => apiClient('/lead/dashboard'),
  getProjects: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    return apiClient(`/lead/projects${qs ? `?${qs}` : ''}`);
  },
  getTeams: () => apiClient('/lead/teams'),
  getTasks: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.projectId) query.append('projectId', params.projectId);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.assigneeId) query.append('assigneeId', params.assigneeId);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return apiClient(`/lead/tasks${qs ? `?${qs}` : ''}`);
  },
  getTaskOptions: () => apiClient('/lead/task-options'),
  createTask: (data) =>
    apiClient('/lead/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id, data) =>
    apiClient(`/lead/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateTaskStatus: (id, status) =>
    apiClient(`/lead/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteTask: (id) =>
    apiClient(`/lead/tasks/${id}`, {
      method: 'DELETE',
    }),
  getActivities: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.days) query.append('days', params.days);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiClient(`/lead/activities${qs ? `?${qs}` : ''}`);
  },
};

export const memberDashboardAPI = {
  getDashboard: () => apiClient('/member/dashboard'),
  getTasks: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    const qs = query.toString();
    return apiClient(`/member/tasks${qs ? `?${qs}` : ''}`);
  },
  updateTaskStatus: (id, status) =>
    apiClient(`/member/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getProjects: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    return apiClient(`/member/projects${qs ? `?${qs}` : ''}`);
  },
  getTeams: () => apiClient('/member/teams'),
  getActivities: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.days) query.append('days', params.days);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiClient(`/member/activities${qs ? `?${qs}` : ''}`);
  },
  updateProfile: (data) =>
    apiClient('/member/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changePassword: (data) =>
    apiClient('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};



