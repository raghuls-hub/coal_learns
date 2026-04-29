import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../../../shared/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('TUTOR_AUTH_TOKEN');
    if (token) {
      apiClient.get('/auth/me')
        .then(res => setUser(res.data.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password, role: 'mentor' });
    const { accessToken, refreshToken, user: u } = res.data.data;
    localStorage.setItem('TUTOR_AUTH_TOKEN', accessToken);
    if (refreshToken) localStorage.setItem('TUTOR_REFRESH_TOKEN', refreshToken);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await apiClient.post('/auth/register', { ...data, role: 'mentor' });
    const { accessToken, refreshToken, user: u } = res.data.data;
    localStorage.setItem('TUTOR_AUTH_TOKEN', accessToken);
    if (refreshToken) localStorage.setItem('TUTOR_REFRESH_TOKEN', refreshToken);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('TUTOR_AUTH_TOKEN');
    localStorage.removeItem('TUTOR_REFRESH_TOKEN');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
