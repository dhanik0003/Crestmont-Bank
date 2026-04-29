import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 12000,
});

// ─── Auth token injection ────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Global 401 handler ──────────────────────────────────────────────────────
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

// ─── In-flight request deduplication ────────────────────────────────────────
// Prevents duplicate GET requests fired in the same render cycle (e.g. React
// StrictMode double-invoke, parallel useEffect calls on the same data).
const pendingRequests = new Map();

const dedupedGet = (url, config) => {
  const key = url + JSON.stringify(config?.params ?? {});
  if (pendingRequests.has(key)) return pendingRequests.get(key);
  const req = api.get(url, config).finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, req);
  return req;
};

// ─── API modules ─────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => dedupedGet('/auth/me'),
};

export const accountAPI = {
  create:          (data)      => api.post('/accounts', data),
  getMyAccounts:   ()          => dedupedGet('/accounts/me'),
  getAllAccounts:  ()          => dedupedGet('/accounts/all'),
  getUserAccounts: (userId)    => dedupedGet(`/accounts/${userId}`),
  lookupById:      (accountId) => dedupedGet(`/accounts/lookup/${accountId}`),
  deleteAccount:   (id)        => api.delete(`/accounts/${id}`),
};

export const transactionAPI = {
  transfer:       (data)      => api.post('/transactions/transfer', data),
  getByAccount:   (accountId) => dedupedGet(`/transactions/${accountId}`),
  getAll:         ()          => dedupedGet('/transactions/all'),
  getAnalytics:   (months)    => dedupedGet('/transactions/analytics', { params: { months } }),
};

export const loanAPI = {
  apply:       (data) => api.post('/loans/apply', data),
  approve:     (id)   => api.put(`/loans/${id}/approve`),
  reject:      (id)   => api.put(`/loans/${id}/reject`),
  getMyLoans:  ()     => dedupedGet('/loans/me'),
  getAllLoans:  ()     => dedupedGet('/loans/all'),
  getUserLoans:(userId) => dedupedGet(`/loans/${userId}`),
};

export const alertAPI = {
  getAll: () => dedupedGet('/alerts'),
};

export const auditAPI = {
  getLogs: (userId) => dedupedGet('/audit', { params: userId ? { userId } : {} }),
};

export const adminAPI = {
  getAllUsers: ()                    => dedupedGet('/admin/users'),
  updateRole:  (userId, roleName)   => api.put(`/admin/users/${userId}/role`, { roleName }),
};

export default api;
