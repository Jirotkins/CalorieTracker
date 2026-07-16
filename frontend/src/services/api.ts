import axios from 'axios';

// Založení  základní instance Axiosu
export const api = axios.create({
  // Adresa backendu
  baseURL: 'http://127.0.0.1:8000',
});

// Interceptor
api.interceptors.request.use((config) => {
  // Je uložený platný JWT token?
  const token = localStorage.getItem('token');

  // Přilepení tokenu do hlavičky požadavku
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
