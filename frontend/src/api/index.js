import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear and redirect
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Export the api instance as default for direct use
export default api;

// Resources API
export const resourcesApi = {
  search: (query, category, type) => 
    api.get('/resources/search', { params: { q: query, category, type } }),
  getAll: (limit = 50) => 
    api.get('/resources', { params: { limit } }),
  getById: (id) => 
    api.get(`/resources/${id}`),
  getByCategory: (categoryId, limit = 20) => 
    api.get(`/resources/category/${categoryId}`, { params: { limit } }),
  create: (data) => 
    api.post('/resources', data),
  update: (id, data) => 
    api.patch(`/resources/${id}`, data),
  delete: (id) => 
    api.delete(`/resources/${id}`),
  trackDownload: (id) => 
    api.post(`/resources/${id}/download`),
};

// Resource Requests API
export const requestsApi = {
  getAll: (status, limit = 50) => 
    api.get('/requests', { params: { status, limit } }),
  getById: (id) => 
    api.get(`/requests/${id}`),
  getByUser: (userId, limit = 20) => 
    api.get(`/requests/user/${userId}`, { params: { limit } }),
  create: (data) => 
    api.post('/requests', data),
  update: (id, data) => 
    api.patch(`/requests/${id}`, data),
  delete: (id) => 
    api.delete(`/requests/${id}`),
  updateStatus: (id, data) => 
    api.patch(`/requests/${id}/status`, data),
};

// Tutors API
export const tutorsApi = {
  getAll: (available, limit = 50) => 
    api.get('/tutors', { params: { available, limit } }),
  getById: (id) => 
    api.get(`/tutors/${id}`),
  getBySubject: (subject, limit = 20) => 
    api.get(`/tutors/subject/${subject}`, { params: { limit } }),
  getSubjects: () => 
    api.get('/tutors/subjects/list'),
  create: (data) => 
    api.post('/tutors', data),
  update: (id, data) => 
    api.patch(`/tutors/${id}`, data),
  delete: (id) => 
    api.delete(`/tutors/${id}`),
  updateAvailability: (id, isAvailable) => 
    api.patch(`/tutors/${id}/availability`, { is_available: isAvailable }),
  createRequest: (data) => 
    api.post('/tutors/requests', data),
  getAllRequests: (status, limit = 50) => 
    api.get('/tutors/requests/all', { params: { status, limit } }),
};

// Posts API
export const postsApi = {
  getAll: (postType, categoryId, limit = 50) => 
    api.get('/posts', { params: { post_type: postType, category_id: categoryId, limit } }),
  getById: (id) => 
    api.get(`/posts/${id}`),
  getByAuthor: (authorId, limit = 20) => 
    api.get(`/posts/author/${authorId}`, { params: { limit } }),
  create: (data) => 
    api.post('/posts', data),
  update: (id, data) => 
    api.patch(`/posts/${id}`, data),
  delete: (id) => 
    api.delete(`/posts/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => 
    api.get('/categories'),
  getWithCounts: () => 
    api.get('/categories/with-counts'),
  getById: (id) => 
    api.get(`/categories/${id}`),
  create: (data) => 
    api.post('/categories', data),
};

// Users API
export const usersApi = {
  getAll: (role, limit = 50) => 
    api.get('/users', { params: { role, limit } }),
  getById: (id) => 
    api.get(`/users/${id}`),
  getByEmail: (email) => 
    api.get(`/users/email/${email}`),
  create: (data) => 
    api.post('/users', data),
  update: (id, data) => 
    api.patch(`/users/${id}`, data),
};
