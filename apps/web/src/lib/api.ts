import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Public endpoints that should never trigger a redirect
const PUBLIC_ENDPOINTS = ['/api/admin/landing', '/api/admin/plans'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isPublic = PUBLIC_ENDPOINTS.some((p) => url.includes(p));
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

      if (!isPublic && !isLoginPage && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;