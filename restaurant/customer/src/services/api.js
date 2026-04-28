import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Menu API
export const menuAPI = {
  getAll: (restaurantId) => api.get(`/customer/menu/${restaurantId || 'all'}`),
  getByCategory: (restaurantId, category) => api.get(`/customer/menu/${restaurantId}/category/${category}`),
  getCategories: (restaurantId) => api.get(`/customer/menu/${restaurantId}/categories`)
};

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post('/customer/orders', orderData),
  getById: (id) => api.get(`/customer/orders/${id}`)
};

export default api;
