import { create } from 'zustand';
import * as authApi from '../api/authApi';
import { disconnectSocket } from '../socket/socket';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,

  setAccessToken: (token) => {
    set({ accessToken: token, isAuthenticated: !!token });
  },

  clearAuth: () => {
    disconnectSocket();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: true,
    });
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(credentials);
      const { user, accessToken } = res.data;
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        initialized: true,
      });
      return res;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(userData);
      const { user, accessToken } = res.data;
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        initialized: true,
      });
      return res;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore logout API errors
    } finally {
      get().clearAuth();
    }
  },

  fetchMe: async () => {
    try {
      const res = await authApi.getMe();
      const user = res.data?.user;
      set({ user, isAuthenticated: true });
      return user;
    } catch (error) {
      get().clearAuth();
      throw error;
    }
  },

  refreshSession: async () => {
    set({ isLoading: true });
    try {
      const res = await authApi.refreshToken();
      const token = res.data?.accessToken;
      if (token) {
        set({ accessToken: token, isAuthenticated: true });
        await get().fetchMe();
      } else {
        get().clearAuth();
      }
    } catch (error) {
      get().clearAuth();
    } finally {
      set({ initialized: true, isLoading: false });
    }
  },
}));

export default useAuthStore;
