import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('TUTOR_AUTH_TOKEN'));

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me'); // apiClient already handles headers
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      role: 'mentor'
    });

    const { accessToken, refreshToken, user } = response.data.data;

    localStorage.setItem('TUTOR_AUTH_TOKEN', accessToken);
    localStorage.setItem('TUTOR_REFRESH_TOKEN', refreshToken);
    localStorage.setItem('TUTOR_USER', JSON.stringify(user));

    setToken(accessToken);
    setUser(user);

    return user;
  };

  const register = async (userData) => {
    const response = await apiClient.post('/auth/register', {
      ...userData,
      role: 'mentor'
    });

    const { accessToken, refreshToken, user } = response.data.data;

    localStorage.setItem('TUTOR_AUTH_TOKEN', accessToken);
    localStorage.setItem('TUTOR_REFRESH_TOKEN', refreshToken);
    localStorage.setItem('TUTOR_USER', JSON.stringify(user));

    setToken(accessToken);
    setUser(user);

    return user;
  };

  const logout = () => {
    localStorage.removeItem('TUTOR_AUTH_TOKEN');
    localStorage.removeItem('TUTOR_REFRESH_TOKEN');
    localStorage.removeItem('TUTOR_USER');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
