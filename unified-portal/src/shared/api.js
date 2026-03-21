import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Detect which portal is calling and use relative token
    const isTutor = window.location.pathname.startsWith('/tutor');
    const tokenKey = isTutor ? 'TUTOR_AUTH_TOKEN' : 'CANDIDATE_AUTH_TOKEN';
    const token = localStorage.getItem(tokenKey);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    
    if (error.response?.status === 401) {
      toast.error('Session Expired. Please login again.');
      const isTutor = window.location.pathname.startsWith('/tutor');
      const isCandidate = window.location.pathname.startsWith('/candidate');
      localStorage.removeItem(isTutor ? 'TUTOR_AUTH_TOKEN' : 'CANDIDATE_AUTH_TOKEN');
      window.location.href = isTutor ? '/tutor/login' : (isCandidate ? '/candidate/login' : '/');
    } else if (error.response?.status === 409) {
      toast.error(message || 'Conflict error occurred.');
    } else if (error.response?.status === 400) {
      toast.error(message || 'Invalid request.');
    } else {
      toast.error(message || 'Something went wrong.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
