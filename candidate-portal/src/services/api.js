import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const login = (credentials) => apiClient.post('/api/auth/login', credentials);
export const register = (userData) => apiClient.post('/api/auth/register', userData);
export const getProfile = () => apiClient.get('/api/auth/me');

// Course API
export const getCourses = () => apiClient.get('/api/courses');
export const getCourse = (id) => apiClient.get(`/api/courses/${id}`);
export const getModules = (courseId) => apiClient.get(`/api/courses/${courseId}/modules`);

// Enrollment API
export const enrollInCourse = (courseId) => apiClient.post('/api/enrollments', { courseId });
export const getMyEnrollments = () => apiClient.get('/api/enrollments/my');
export const checkEnrollment = (courseId) => apiClient.get(`/api/enrollments/check/${courseId}`);

export default apiClient;
