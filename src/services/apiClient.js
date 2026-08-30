/**
 * LOUMOO Universal Commerce — Isomorphic API Client Layer
 * Connects frontend views to backend REST endpoints with graceful offline fallback
 */

import { products as mockProducts } from '../data/products.js';
import { categories as mockCategories } from '../data/categories.js';

class ApiClient {
  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? (window.LOUMOO_API_URL || '') 
      : 'http://localhost:8080';
    this.token = typeof localStorage !== 'undefined' ? localStorage.getItem('loumoo_token') : null;
  }

  setAuthToken(token) {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem('loumoo_token', token);
      } else {
        localStorage.removeItem('loumoo_token');
      }
    }
  }

  async _fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error?.message || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      throw err;
    }
  }

  // ==========================================
  // AUTHENTICATION & IDENTITY (02.01 - 02.14)
  // ==========================================

  async signUp(data) {
    try {
      const res = await this._fetch('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res.data;
    } catch (e) {
      // Local fallback for offline mode
      return {
        success: true,
        user: {
          id: `usr_${Date.now()}`,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          primaryRole: data.intent === 'seller' ? 'seller' : 'customer',
          completionPercentage: 35
        },
        isLocalFallback: true
      };
    }
  }

  async signIn(credentials) {
    try {
      const res = await this._fetch('/api/v1/auth/signin', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      if (res.data?.token) {
        this.setAuthToken(res.data.token);
      }
      return res.data;
    } catch (e) {
      return {
        success: true,
        user: {
          id: 'usr_mock_123',
          firstName: 'Rostand',
          lastName: 'Tchuekam',
          primaryRole: 'customer',
          completionPercentage: 85
        },
        isLocalFallback: true
      };
    }
  }

  async signOut() {
    this.setAuthToken(null);
    try {
      await this._fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {}
    return { success: true };
  }

  async sendOtp(phoneNumber) {
    try {
      const res = await this._fetch('/api/v1/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber })
      });
      return res.data;
    } catch (e) {
      return { success: true, message: `Code sent to ${phoneNumber}`, isLocalFallback: true };
    }
  }

  async verifyOtp(phoneNumber, code) {
    try {
      const res = await this._fetch('/api/v1/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, code })
      });
      return res.data;
    } catch (e) {
      return { success: true, isPhoneVerified: true, isLocalFallback: true };
    }
  }

  async requestPasswordReset(email) {
    return this._fetch('/api/v1/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async confirmPasswordReset(data) {
    return this._fetch('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMe() {
    try {
      const response = await this._fetch('/api/v1/users/me');
      return response.data?.user || response.data?.profile || null;
    } catch (e) {
      return null;
    }
  }

  async updateMe(updates) {
    try {
      const response = await this._fetch('/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      return response.data;
    } catch (e) {
      return { success: true, isLocalFallback: true };
    }
  }

  async getSessions() {
    try {
      const res = await this._fetch('/api/v1/users/me/sessions');
      return res.data?.sessions || [];
    } catch (e) {
      return [];
    }
  }

  async revokeSession(sessionId) {
    return this._fetch(`/api/v1/users/me/sessions/${sessionId}`, { method: 'DELETE' });
  }

  async getPrivacy() {
    try {
      const res = await this._fetch('/api/v1/users/me/privacy');
      return res.data?.preferences || null;
    } catch (e) {
      return { analyticsConsent: true, marketingEmails: true, personalizedRecommendations: true, profileVisibility: 'public' };
    }
  }

  async updatePrivacy(updates) {
    return this._fetch('/api/v1/users/me/privacy', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deleteAccount(confirmText, reason) {
    return this._fetch('/api/v1/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ confirmText, reason })
    });
  }

  async getPublicUser(userId) {
    try {
      const res = await this._fetch(`/api/v1/users/${userId}/public`);
      return res.data?.user || null;
    } catch (e) {
      return null;
    }
  }

  // ==========================================
  // CATALOG & PRODUCTS
  // ==========================================

  async getProducts(params = {}) {
    try {
      const searchParams = new URLSearchParams(params).toString();
      const response = await this._fetch(`/api/v1/products?${searchParams}`);
      if (response && response.data) {
        return response.data;
      }
    } catch (e) {}

    const flattened = [
      ...(mockProducts.hotels || []).map(p => ({ ...p, vertical: 'hotels' })),
      ...(mockProducts.electronics || []).map(p => ({ ...p, vertical: 'electronics' })),
      ...(mockProducts.fashion || []).map(p => ({ ...p, vertical: 'fashion' })),
      ...(mockProducts.home || []).map(p => ({ ...p, vertical: 'home' })),
      ...(mockProducts.services || []).map(p => ({ ...p, vertical: 'services' })),
      ...(mockProducts.education || []).map(p => ({ ...p, vertical: 'education' }))
    ];

    let filtered = flattened;
    if (params.category) {
      filtered = filtered.filter(p => p.category?.toLowerCase() === params.category.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(p => p.title?.toLowerCase().includes(q) || p.merchant?.toLowerCase().includes(q));
    }

    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      limit: filtered.length,
      hasMore: false,
      isLocalFallback: true
    };
  }

  async getProduct(id) {
    try {
      const response = await this._fetch(`/api/v1/products/${id}`);
      if (response && response.data) {
        return response.data;
      }
    } catch (e) {}

    const all = [
      ...(mockProducts.hotels || []),
      ...(mockProducts.electronics || []),
      ...(mockProducts.fashion || []),
      ...(mockProducts.home || []),
      ...(mockProducts.services || []),
      ...(mockProducts.education || [])
    ];
    return all.find(p => p.id === id) || null;
  }

  async getCategories() {
    try {
      const response = await this._fetch('/api/v1/categories');
      if (response && response.data) {
        return response.data;
      }
    } catch (e) {}
    return mockCategories;
  }

  async getHealth() {
    try {
      return await this._fetch('/api/v1/health');
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  }
}

export const apiClient = new ApiClient();
