import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, dbService, type Profile } from '../services/supabase';

interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isMockEnabled = !import.meta.env.VITE_SUPABASE_URL || 
                      !import.meta.env.VITE_SUPABASE_ANON_KEY || 
                      import.meta.env.VITE_SUPABASE_URL.includes('your-project-id');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearStaleAuth = useCallback(() => {
    // 1. Immediately purge all Supabase & session tokens from localStorage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('session'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}

    // 2. Clear state immediately so the UI instantly switches
    setUser(null);
    setProfile(null);

    // 3. Fire-and-forget silent local signout
    try {
      supabase?.auth.signOut({ scope: 'local' }).catch(() => {});
    } catch (e) {}
  }, []);

  // Load active session instantly
  useEffect(() => {
    if (isMockEnabled) {
      const mockSession = localStorage.getItem('life_os_mock_session');
      if (mockSession) {
        try {
          const parsed = JSON.parse(mockSession);
          setUser(parsed);
          dbService.getProfile(parsed.id)
            .then(setProfile)
            .catch(() => {});
        } catch (e) {}
      }
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Fast Supabase auth initialization
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase!.auth.getSession();
        
        if (sessionError || !session?.user) {
          if (isMounted) {
            clearStaleAuth();
            setLoading(false);
          }
          return;
        }

        // Check if token is expired
        const isExpired = session.expires_at ? (session.expires_at * 1000 < Date.now() + 30000) : false;

        if (isExpired) {
          try {
            const { data: refreshData, error: refreshError } = await supabase!.auth.refreshSession();
            if (refreshError || !refreshData.session?.user) {
              if (isMounted) {
                clearStaleAuth();
                setLoading(false);
              }
              return;
            }
            if (isMounted) {
              const u: AuthUser = { id: refreshData.session.user.id, email: refreshData.session.user.email || '' };
              setUser(u);
              setLoading(false);
              // Fetch profile in background non-blocking
              dbService.getProfile(u.id).then(p => isMounted && setProfile(p)).catch(() => {});
            }
            return;
          } catch (e) {
            if (isMounted) {
              clearStaleAuth();
              setLoading(false);
            }
            return;
          }
        }

        // Valid active session: unblock UI immediately!
        if (isMounted) {
          const u: AuthUser = { id: session.user.id, email: session.user.email || '' };
          setUser(u);
          setLoading(false);
          // Fetch profile in background
          dbService.getProfile(session.user.id).then(p => isMounted && setProfile(p)).catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          clearStaleAuth();
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        clearStaleAuth();
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const u: AuthUser = { id: session.user.id, email: session.user.email || '' };
        setUser(u);
        setLoading(false);
        dbService.getProfile(session.user.id).then(p => isMounted && setProfile(p)).catch(() => {});
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearStaleAuth]);

  const refreshProfile = async () => {
    if (user) {
      try {
        const prof = await dbService.getProfile(user.id);
        setProfile(prof);
      } catch (err) {
        console.warn('Failed to refresh profile', err);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isMockEnabled) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        
        const mockUser: AuthUser = {
          id: 'usr-' + btoa(email).substring(0, 10).replace(/=/g, ''),
          email,
        };

        const prof = await dbService.getProfile(mockUser.id).catch(() => null);
        if (prof) setProfile(prof);

        localStorage.setItem('life_os_mock_session', JSON.stringify(mockUser));
        setUser(mockUser);
        return;
      }

      const { data, error } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data?.user) {
        const u: AuthUser = { id: data.user.id, email: data.user.email || '' };
        setUser(u);
        dbService.getProfile(data.user.id).then(setProfile).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      if (isMockEnabled) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const mockUser: AuthUser = {
          id: 'usr-' + btoa(email).substring(0, 10).replace(/=/g, ''),
          email,
          display_name: name || 'Anirudh',
        };

        const newProfile: Profile = {
          id: mockUser.id,
          display_name: name || 'Anirudh',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem('life_os_profile', JSON.stringify(newProfile));
        localStorage.setItem('life_os_mock_session', JSON.stringify(mockUser));
        setUser(mockUser);
        setProfile(newProfile);
        return;
      }

      const { data, error } = await supabase!.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            display_name: name || 'Anirudh',
          },
        },
      });

      if (error) throw error;
      
      if (data?.user) {
        const u: AuthUser = { id: data.user.id, email: data.user.email || '' };
        setUser(u);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isMockEnabled) {
        localStorage.removeItem('life_os_mock_session');
        setUser(null);
        setProfile(null);
        return;
      }
      clearStaleAuth();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
