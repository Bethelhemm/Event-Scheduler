import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set default Authorization header
export const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('auth_token');
  console.log('API Request:', config.method, config.url, 'Authorization:', token ? `Bearer ${token}` : 'No token');
  // Do not add Authorization header for register endpoint
  if (token && !config.url?.includes('/auth/register/')) {
    config.headers.Authorization = `Bearer ${token}`;
    setAuthToken(token);
  }
  return config;
});

// Response interceptor to handle errors and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const authStore = useAuthStore.getState();
        await authStore.refreshAccessToken();
        const token = localStorage.getItem('auth_token');
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          setAuthToken(token);
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        setAuthToken(null);
        // Do not redirect to login automatically as per user request
        // Optionally, you can emit an event or set a global state to notify user
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
