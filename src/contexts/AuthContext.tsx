import React, { createContext, useContext, useEffect, useState } from 'react';
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

  // Load active session
  useEffect(() => {
    if (isMockEnabled) {
      const mockSession = localStorage.getItem('life_os_mock_session');
      if (mockSession) {
        const parsed = JSON.parse(mockSession);
        setUser(parsed);
        // Load profile
        dbService.getProfile(parsed.id)
          .then(setProfile)
          .catch(err => console.error('Failed to load mock profile', err))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    // Supabase auth subscription
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: AuthUser = { id: session.user.id, email: session.user.email || '' };
        setUser(u);
        dbService.getProfile(session.user.id)
          .then(setProfile)
          .catch(err => console.error('Failed to load profile', err))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u: AuthUser = { id: session.user.id, email: session.user.email || '' };
        setUser(u);
        try {
          const prof = await dbService.getProfile(session.user.id);
          setProfile(prof);
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      try {
        const prof = await dbService.getProfile(user.id);
        setProfile(prof);
      } catch (err) {
        console.error('Failed to refresh profile', err);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isMockEnabled) {
        // Mock success authentication
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        
        const mockUser: AuthUser = {
          id: 'usr-' + btoa(email).substring(0, 10).replace(/=/g, ''),
          email,
        };

        // Create profile if not exist
        const prof = await dbService.getProfile(mockUser.id);
        if (prof) {
          setProfile(prof);
        }

        localStorage.setItem('life_os_mock_session', JSON.stringify(mockUser));
        setUser(mockUser);
        return;
      }

      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
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

        // Create custom mock profile
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
        email,
        password,
        options: {
          data: {
            display_name: name || 'Anirudh',
          },
        },
      });

      if (error) throw error;
      
      // Force profile creation wait if session immediate
      if (data?.user) {
        const mockUser: AuthUser = { id: data.user.id, email: data.user.email || '' };
        setUser(mockUser);
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
      const { error } = await supabase!.auth.signOut();
      if (error) throw error;
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
