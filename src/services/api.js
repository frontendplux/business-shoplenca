// ============================================================================
// src/services/api.js
// Unified API Client for Web & Mobile App
// Automatically handles Bearer tokens, currency headers, and query params
// ============================================================================

import { APP_CONFIG } from '../config/appConfig';

const TOKEN_KEY = 'shoplenca_auth_token';
const CURRENCY_KEY = 'shoplenca_currency';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getSavedCurrency() {
  try {
    return localStorage.getItem(CURRENCY_KEY) || '';
  } catch {
    return '';
  }
}

export function setSavedCurrency(code) {
  try {
    if (code) localStorage.setItem(CURRENCY_KEY, code);
  } catch {
    // ignore
  }
}

export async function apiRequest(endpoint, { method = 'GET', params = null, body = null } = {}) {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const baseUrl = APP_CONFIG.API_BASE_URL.replace(/\/+$/, '');
  const path = cleanEndpoint.endsWith('.php') ? cleanEndpoint : `${cleanEndpoint}.php`;
  let url = `${baseUrl}/${path}`;

  if (params && typeof params === 'object') {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) {
        v.forEach((item) => usp.append(`${k}[]`, item));
      } else {
        usp.append(k, String(v));
      }
    });
    const qs = usp.toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }

  const headers = {
    Accept: 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const savedCur = getSavedCurrency();
  if (savedCur) {
    headers['X-Currency'] = savedCur;
  }

  const fetchOpts = {
    method,
    headers,
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    fetchOpts.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOpts);
    const data = await response.json().catch(() => ({ ok: false, message: 'Invalid server response' }));
    return data;
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'Network error. Please check your connection.',
    };
  }
}

export const api = {
  get: async (endpoint, params = null) => {
    const res = await apiRequest(endpoint, { method: 'GET', params });
    if (res && res.ok === false && !res.login) {
      const err = new Error(res.message || res.msg || 'Request failed');
      err.response = res;
      throw err;
    }
    return res;
  },
  post: async (endpoint, body = {}) => {
    const res = await apiRequest(endpoint, { method: 'POST', body });
    if (res && res.ok === false) {
      const err = new Error(res.message || res.msg || 'Action failed');
      err.response = res;
      throw err;
    }
    return res;
  },

  getBootstrap: (currency) => apiRequest('bootstrap', { params: currency ? { currency } : null }),
  getHome: () => apiRequest('home'),
  getProducts: (params) => apiRequest('products', { params }),
  getProductDetail: (slug, params = {}) =>
    apiRequest('products', { params: { mode: 'detail', product_slug: slug, ...params } }),
  submitReview: (payload) => apiRequest('products', { method: 'POST', body: { action: 'review', ...payload } }),

  auth: (action, payload = {}) => apiRequest('auth', { method: 'POST', body: { action, ...payload } }),

  getCart: () => apiRequest('cart'),
  updateCart: (action, product_id = 0, quantity = 1, extra = {}) =>
    apiRequest('cart', { method: 'POST', body: { action, product_id, quantity, ...extra } }),

  getWishlist: () => apiRequest('wishlist'),
  toggleWishlist: (product_id, action = 'toggle') =>
    apiRequest('wishlist', { method: 'POST', body: { product_id, action } }),

  getCheckout: () => apiRequest('checkout'),
  placeOrder: (payload) => apiRequest('checkout', { method: 'POST', body: payload }),

  getMember: () => apiRequest('member'),
  memberAction: (action, payload = {}) => apiRequest('member', { method: 'POST', body: { action, ...payload } }),

  getBlog: (params) => apiRequest('blog', { params }),
  getBooks: (params) => apiRequest('books', { params }),

  getContact: () => apiRequest('contact'),
  sendContact: (payload) => apiRequest('contact', { method: 'POST', body: payload }),

  getStaticPage: (page, tab) => apiRequest('pages', { params: { page, tab } }),

  getAdmin: () => apiRequest('admin'),
  adminAction: (action, payload = {}) => apiRequest('admin', { method: 'POST', body: { action, ...payload } }),

  getNotifications: () => apiRequest('notifications'),
  notificationAction: (action, payload = {}) =>
    apiRequest('notifications', { method: 'POST', body: { action, ...payload } }),
};

export default api;

