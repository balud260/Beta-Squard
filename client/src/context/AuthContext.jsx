import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  async function checkLoggedInUser() {
    const token = localStorage.getItem('solvelink_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      localStorage.removeItem('solvelink_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await api.login({ email, password });
    if (res && res.token && res.user) {
      localStorage.setItem('solvelink_token', res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Invalid response from server.');
  }

  function setSession(userData, token) {
    if (token) {
      localStorage.setItem('solvelink_token', token);
    }
    setUser(userData);
  }

  async function quickLogin(email) {
    return login(email, 'Demo@123');
  }

  function logout() {
    localStorage.removeItem('solvelink_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, setSession, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
