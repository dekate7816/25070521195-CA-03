import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setApiCsrfToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getMe();
      if (data?.user) {
        setUser(data.user);
        if (data.csrfToken) {
          setApiCsrfToken(data.csrfToken);
        }
      } else {
        setUser(null);
        setApiCsrfToken(null);
      }
    } catch {
      setUser(null);
      setApiCsrfToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setUser(data.user);
    if (data.csrfToken) setApiCsrfToken(data.csrfToken);
    return data;
  };

  const register = async (email, password, name, timezone) => {
    const data = await api.register({ email, password, name, timezone });
    setUser(data.user);
    if (data.csrfToken) setApiCsrfToken(data.csrfToken);
    return data;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setApiCsrfToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchSession,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
