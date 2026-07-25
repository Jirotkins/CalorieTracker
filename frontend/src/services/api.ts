import axios from 'axios';

// Dynamická adresa backendu
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Založení  základní instance Axiosu
export const api = axios.create({
  // Adresa backendu
  baseURL: API_URL,
});

// Request Interceptor
api.interceptors.request.use((config) => {
  // Je uložený platný JWT token?
  const token = localStorage.getItem('token');

  // Přilepení tokenu do hlavičky požadavku
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor (při chybném tokenu ho vymaže a přesměruje na login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);