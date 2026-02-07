import axios from 'axios';

// Use VITE_API_URL if set, otherwise use empty string for relative paths (same-origin)
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If explicitly set to empty string or undefined, use relative path
  if (envUrl === '' || envUrl === undefined) {
    return '';
  }
  return envUrl;
};

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
