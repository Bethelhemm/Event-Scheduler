import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/auth';
import api from '../services/api';

export interface User {
  id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
  refreshAccessToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      
      login: async (username, password) => {
        const response = await authService.login(username, password);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('refresh_token', response.refresh);
        set({ user: response.user, isAuthenticated: true, token: response.token, refreshToken: response.refresh });
      },
      
      register: async (username, password, email) => {
        const response = await authService.register(username, password, email);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('refresh_token', response.refresh);
        set({ user: response.user, isAuthenticated: true, token: response.token, refreshToken: response.refresh });
      },
      
      logout: async () => {
        const refreshToken = get().refreshToken || localStorage.getItem('refresh_token');
        console.log('Logout refresh token:', refreshToken);
        console.log('Logout auth token:', localStorage.getItem('auth_token'));
        await authService.logout();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false, token: null, refreshToken: null });
      },
      
      checkAuth: () => {
        const state = get();
        return state.isAuthenticated && !!state.token;
      },

      refreshAccessToken: async () => {
        try {
          let refresh = get().refreshToken;
          if (!refresh) {
            // Try to get refresh token from localStorage if store is empty
            refresh = localStorage.getItem('refresh_token');
            if (!refresh) throw new Error('No refresh token available');
            // Sync store with localStorage token
            set({ refreshToken: refresh });
          }
          console.log('Refreshing access token with refresh token:', refresh);
          const response = await api.post('/auth/token/refresh/', { refresh });
          console.log('Token refresh response:', response.data);
          localStorage.setItem('auth_token', response.data.access);
          set({ token: response.data.access });
        } catch (error) {
          console.error('Failed to refresh access token', error);
          await get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
