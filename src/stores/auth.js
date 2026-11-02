import { defineStore } from 'pinia';
import api from '@/services/api';
import { tokenStorage } from '@/services/tokenStorage';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: tokenStorage.get(),
    user: null,
  }),
  getters: {
    isAuthenticated: (s) => Boolean(s.token),
    permissions: (s) => s.user?.permissions || [],
    // Punya minimal satu hak akses CMS = pengurus.
    isStaff() {
      return this.permissions.length > 0;
    },
    isAdmin() {
      return this.permissions.includes('*');
    },
  },
  actions: {
    can(...keys) {
      return this.isAdmin || keys.some((k) => this.permissions.includes(k));
    },
    /** payload: { portal: 'pengurus', username, password } | { portal: 'warga', identifier, pin } + remember */
    async login(payload) {
      const { data } = await api.post('/auth/login', payload);
      tokenStorage.set(data.token, payload.remember);
      this.token = data.token;
      this.user = data.user;
      return data;
    },
    async fetchMe() {
      const { data } = await api.get('/auth/me');
      this.user = data.user;
      return data.user;
    },
    logout() {
      tokenStorage.clear();
      this.token = null;
      this.user = null;
    },
  },
});
