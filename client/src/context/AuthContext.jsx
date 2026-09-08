import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('edustaff_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('edustaff_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('edustaff_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('[Auth] Session check failed, clearing token.');
          setToken(null);
          setUser(null);
          localStorage.removeItem('edustaff_token');
          localStorage.removeItem('edustaff_user');
        }
      }
      setLoading(false);
    }
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('edustaff_token', res.data.token);
      localStorage.setItem('edustaff_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
  };

  const switchRole = async (targetRole) => {
    try {
      const res = await authAPI.switchRole(targetRole);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('edustaff_token', res.data.token);
        localStorage.setItem('edustaff_user', JSON.stringify(res.data.user));
        return res.data.user;
      }
    } catch (err) {
      console.error('[Auth] Error switching demo role:', err);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('edustaff_token');
    localStorage.removeItem('edustaff_user');
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, loading, login, logout, switchRole, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
