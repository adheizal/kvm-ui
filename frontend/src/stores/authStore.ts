import { create } from 'zustand';
import { authStorage, type User } from '../lib/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (token: string, user: User) => {
    authStorage.setToken(token);
    authStorage.setUser(user);
    set({ token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    authStorage.clear();
    set({ token: null, user: null, isAuthenticated: false });
  },

  initAuth: () => {
    const token = authStorage.getToken();
    const user = authStorage.getUser();
    if (token && user) {
      set({ token, user, isAuthenticated: true });
    }
  },
}));
