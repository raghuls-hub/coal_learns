import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('CANDIDATE_USER');
    const token = localStorage.getItem('CANDIDATE_AUTH_TOKEN');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password, role: 'candidate' });
    const { accessToken, user: userData } = response.data.data;
    
    localStorage.setItem('CANDIDATE_AUTH_TOKEN', accessToken);
    localStorage.setItem('CANDIDATE_USER', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const register = async (userData) => {
    // Force role to candidate for portal registrations
    const response = await apiClient.post('/auth/register', { 
      ...userData, 
      role: 'candidate' 
    });
    const { accessToken, user: registeredUser } = response.data.data;
    
    localStorage.setItem('CANDIDATE_AUTH_TOKEN', accessToken);
    localStorage.setItem('CANDIDATE_USER', JSON.stringify(registeredUser));
    setUser(registeredUser);
    
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('CANDIDATE_AUTH_TOKEN');
    localStorage.removeItem('CANDIDATE_USER');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
