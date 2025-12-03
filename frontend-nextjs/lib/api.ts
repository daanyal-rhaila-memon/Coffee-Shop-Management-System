import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 errors (unauthorized) - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.customer));
    }
    return {
      token: response.data.access_token,
      user: response.data.customer,
    };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mochamagic_cart');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data.customer;
  },

  updateProfile: async (data: { name?: string; phone?: string; address?: string }) => {
    const response = await api.put('/auth/profile', data);
    return response.data.customer;
  },
};

// Products API
export const productsAPI = {
  getAll: async (params?: {
    category_id?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
  }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data.product;
  },

  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data.categories;
  },

  getFeatured: async () => {
    const response = await api.get('/products/featured');
    return response.data.products;
  },
};

// Orders API
export const ordersAPI = {
  create: async (data: {
    items: Array<{ product_id: number; quantity: number; price: number }>;
    payment_method: string;
    delivery_fee?: number;
    delivery_address?: string;
    city?: string;
    postal_code?: string;
    notes?: string;
  }) => {
    console.log('create order', data);
    const response = await api.post('/orders', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/orders');
    return response.data.orders;
  },

  getById: async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.order;
  },

  cancel: async (id: number) => {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  getAll: async () => {
    const response = await api.get('/reviews');
    return response.data;
  },

  create: async (data: {
    product_id: number;
    rating: number;
    comment?: string;
  }) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  getByProduct: async (productId: number) => {
    const response = await api.get(`/reviews/product/${productId}`);
    return response.data;
  },

  getCustomerReviews: async () => {
    const response = await api.get('/reviews/customer');
    return response.data.reviews;
  },

  update: async (reviewId: number, data: { rating?: number; comment?: string }) => {
    const response = await api.put(`/reviews/${reviewId}`, data);
    return response.data;
  },

  delete: async (reviewId: number) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

// Rewards API
export const rewardsAPI = {
  get: async () => {
    const response = await api.get('/rewards');
    return response.data;
  },

  redeem: async (points: number) => {
    const response = await api.post('/rewards/redeem', { points });
    return response.data;
  },
};

export default api;
