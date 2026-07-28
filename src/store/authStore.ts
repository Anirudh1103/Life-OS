import { create } from 'zustand';
import { AuthUser } from '@/types/firestore';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  initializing: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (value: boolean) => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  initializing: true,
  setUser: (user) => set({ user, initializing: false }),
  setLoading: (value) => set({ isLoading: value }),
  setInitializing: (value) => set({ initializing: value }),
}));
