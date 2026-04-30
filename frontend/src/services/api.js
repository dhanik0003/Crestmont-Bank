import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 12000);
const AUTH_RETRY_TIMEOUT_MS = Number(import.meta.env.VITE_AUTH_RETRY_TIMEOUT_MS || 30000);
const RETRYABLE_AUTH_STATUS_CODES = new Set([502, 503, 504]);
const RETRYABLE_AUTH_ERROR_CODES = new Set(['ECONNABORTED', 'ERR_NETWORK']);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Prevent duplicate GET requests fired in the same render cycle.
const pendingRequests = new Map();

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const isRetryableAuthError = (error) => {
  if (RETRYABLE_AUTH_STATUS_CODES.has(error.response?.status)) {
    return true;
  }

  return (
    RETRYABLE_AUTH_ERROR_CODES.has(error.code) ||
    error.message === 'Network Error'
  );
};

const dedupedGet = (url, config) => {
  const key = url + JSON.stringify(config?.params ?? {});
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const req = api.get(url, config).finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, req);
  return req;
};

// Wake sleeping hosts before surfacing a false auth failure on the first click.
const warmBackend = async () => {
  try {
    await api.get('/health', { timeout: AUTH_RETRY_TIMEOUT_MS });
  } catch {
    // Ignore the warm-up result and let the real auth request report any error.
  }
};

const retryAuthPost = async (url, data, config = {}) => {
  try {
    return await api.post(url, data, config);
  } catch (error) {
    if (!isRetryableAuthError(error)) {
      throw error;
    }

    await warmBackend();
    await delay(500);

    return api.post(url, data, {
      ...config,
      timeout: Math.max(config.timeout ?? 0, AUTH_RETRY_TIMEOUT_MS),
    });
  }
};

export const getApiErrorMessage = (error, fallbackMessage) => {
  const message =
    error.response?.data?.error ||
    error.response?.data?.errors?.[0]?.msg;

  if (message) {
    return message;
  }

  if (isRetryableAuthError(error)) {
    return 'The secure service is waking up. Please try again in a few seconds.';
  }

  return fallbackMessage;
};

export const authAPI = {
  register: (data) => retryAuthPost('/auth/register', data),
  login: (data) => retryAuthPost('/auth/login', data),
  me: () => dedupedGet('/auth/me'),
  warmup: () => warmBackend(),
};

export const accountAPI = {
  create: (data) => api.post('/accounts', data),
  getMyAccounts: () => dedupedGet('/accounts/me'),
  getAllAccounts: () => dedupedGet('/accounts/all'),
  getUserAccounts: (userId) => dedupedGet(`/accounts/${userId}`),
  lookupById: (accountId) => dedupedGet(`/accounts/lookup/${accountId}`),
  downloadStatement: (id, params) =>
    api.get(`/accounts/${id}/statement`, {
      params,
      responseType: 'arraybuffer',
      headers: { Accept: 'application/pdf' },
    }),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
};

export const transactionAPI = {
  transfer: (data) => api.post('/transactions/transfer', data),
  getByAccount: (accountId) => dedupedGet(`/transactions/${accountId}`),
  getAll: () => dedupedGet('/transactions/all'),
  getAnalytics: (months) => dedupedGet('/transactions/analytics', { params: { months } }),
};

export const loanAPI = {
  apply: (data) => api.post('/loans/apply', data),
  approve: (id) => api.put(`/loans/${id}/approve`),
  reject: (id) => api.put(`/loans/${id}/reject`),
  getMyLoans: () => dedupedGet('/loans/me'),
  getAllLoans: () => dedupedGet('/loans/all'),
  getUserLoans: (userId) => dedupedGet(`/loans/${userId}`),
};

export const alertAPI = {
  getAll: () => dedupedGet('/alerts'),
};

export const auditAPI = {
  getLogs: (userId) => dedupedGet('/audit', { params: userId ? { userId } : {} }),
};

export const adminAPI = {
  getAllUsers: () => dedupedGet('/admin/users'),
  updateRole: (userId, roleName) => api.put(`/admin/users/${userId}/role`, { roleName }),
};

export default api;
