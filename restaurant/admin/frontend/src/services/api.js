import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// Menu API
export const menuAPI = {
  getAll: () => api.get('/menu'),
  getCategories: () => api.get('/menu/categories'),
  getByCategory: (category) => api.get(`/menu/category/${category}`),
  getOne: (id) => api.get(`/menu/${id}`),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  toggleAvailability: (id) => api.patch(`/menu/${id}/toggle`),
  delete: (id) => api.delete(`/menu/${id}`),
  uploadImage: (formData) => {
    return axios.post(`${API_BASE_URL}/menu/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
};

// Orders API
export const ordersAPI = {
  getAll: (status) => api.get('/orders', { params: { status } }),
  getStats: () => api.get('/orders/stats'),
  getRecent: (limit = 10) => api.get('/orders/recent', { params: { limit } }),
  getOne: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancel: (id) => api.delete(`/orders/${id}`)
};

export default api;
