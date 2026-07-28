import { useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const initializing = useAuthStore((state) => state.initializing);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setInitializing = useAuthStore((state) => state.setInitializing);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((profile) => {
      setUser(profile);
      setLoading(false);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setInitializing]);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const profile = await authService.login(credentials);
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      await authService.sendPasswordReset(email);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    initializing,
    login,
    signOut,
    sendPasswordReset,
  };
}
