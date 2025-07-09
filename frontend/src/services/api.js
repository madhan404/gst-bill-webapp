import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Local API URL from .env
  // baseURL: 'https://gst-bill-backend-7sp5.onrender.com', // Deployed backend (commented for local)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api; 