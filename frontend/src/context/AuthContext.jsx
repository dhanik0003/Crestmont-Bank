import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const readStorage = () => {
  try {
    const token = localStorage.getItem('token');
    const raw   = localStorage.getItem('user');
    if (token && raw) return { token, user: JSON.parse(raw) };
  } catch {
    // Corrupted storage — clear it
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  // Initialise synchronously from localStorage so there's no flash of
  // unauthenticated state on hard refresh.
  const [state, setState] = useState(() => {
    const saved = readStorage();
    if (saved) {
      api.defaults.headers.common['Authorization'] = `Bearer ${saved.token}`;
      return { user: saved.user, loading: false };
    }
    return { user: null, loading: false };
  });

  const login = useCallback((token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setState({ user: userData, loading: false });
  }, []);

  const updateUser = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setState((prev) => ({ ...prev, user: userData }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setState({ user: null, loading: false });
  }, []);

  const value = useMemo(
    () => ({ user: state.user, loading: state.loading, login, logout, updateUser }),
    [state.user, state.loading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
