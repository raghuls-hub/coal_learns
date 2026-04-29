import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../../../shared/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('CANDIDATE_USER');
    const token = localStorage.getItem('CANDIDATE_AUTH_TOKEN');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password, role: 'candidate' });
    const { accessToken, user: u } = res.data.data;
    localStorage.setItem('CANDIDATE_AUTH_TOKEN', accessToken);
    localStorage.setItem('CANDIDATE_USER', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await apiClient.post('/auth/register', { ...data, role: 'candidate' });
    const { accessToken, user: u } = res.data.data;
    localStorage.setItem('CANDIDATE_AUTH_TOKEN', accessToken);
    localStorage.setItem('CANDIDATE_USER', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('CANDIDATE_AUTH_TOKEN');
    localStorage.removeItem('CANDIDATE_USER');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
