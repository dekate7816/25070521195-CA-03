/**
 * Centralized REST API Service using native fetch
 * Explicitly replaces Axios without third-party dependencies.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

let currentCsrfToken = null;

export function setApiCsrfToken(token) {
  currentCsrfToken = token;
}

export function getApiCsrfToken() {
  return currentCsrfToken;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  // Auto-attach CSRF token on state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (currentCsrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-CSRF-Token'] = currentCsrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // send and receive HttpOnly session cookies
  });

  // Parse JSON response
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.details = data?.error?.details || null;
    throw error;
  }

  // Update CSRF token if returned in response
  if (data?.csrfToken) {
    setApiCsrfToken(data.csrfToken);
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Dashboard & Insights
  getDashboardSummary: (date) => request(`/dashboard/summary${date ? `?date=${date}` : ''}`),
  getTaskInsights: () => request('/insights/tasks'),
  getHabitInsights: () => request('/insights/habits'),

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    return request(`/tasks${qs ? `?${qs}` : ''}`);
  },
  createTask: (body) => request('/tasks', { method: 'POST', body }),
  getTaskById: (id) => request(`/tasks/${id}`),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: 'PATCH', body }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Habits
  getHabits: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/habits${query ? `?${query}` : ''}`);
  },
  createHabit: (body) => request('/habits', { method: 'POST', body }),
  getHabitById: (id) => request(`/habits/${id}`),
  updateHabit: (id, body) => request(`/habits/${id}`, { method: 'PATCH', body }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
  getHabitCompletions: (id) => request(`/habits/${id}/completions`),
  recordHabitCompletion: (id, date) => request(`/habits/${id}/completions/${date}`, { method: 'PUT' }),
  removeHabitCompletion: (id, date) => request(`/habits/${id}/completions/${date}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (body) => request('/categories', { method: 'POST', body }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PATCH', body }),
  deleteCategory: (id, reassignTo) =>
    request(`/categories/${id}${reassignTo ? `?reassignTo=${reassignTo}` : ''}`, { method: 'DELETE' }),

  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (body) => request('/profile', { method: 'PATCH', body }),
};
