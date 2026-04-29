import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

apiClient.interceptors.request.use((config) => {
  const isTutor = window.location.pathname.startsWith('/tutor');
  const token = localStorage.getItem(isTutor ? 'TUTOR_AUTH_TOKEN' : 'CANDIDATE_AUTH_TOKEN');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message;
    if (err.response?.status === 401) {
      toast.error('Session expired. Please login again.');
      const isTutor = window.location.pathname.startsWith('/tutor');
      localStorage.removeItem(isTutor ? 'TUTOR_AUTH_TOKEN' : 'CANDIDATE_AUTH_TOKEN');
      window.location.href = isTutor ? '/tutor/login' : '/candidate/login';
    } else if (err.response?.status !== 404) {
      toast.error(msg || 'Something went wrong.');
    }
    return Promise.reject(err);
  }
);

export default apiClient;
