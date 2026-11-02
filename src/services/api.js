import axios from 'axios';
import { tokenStorage } from './tokenStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLogin && tokenStorage.get()) {
      tokenStorage.clear();
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error) =>
  error.response?.data?.message || (error.request ? 'Server tidak dapat dihubungi' : error.message);

export const fieldErrors = (error) => error.response?.data?.errors || {};

export default api;
