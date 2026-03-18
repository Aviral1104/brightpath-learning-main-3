import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient, isBackendConfigured } from '@/integrations/backend/client';
import { Session } from '@supabase/supabase-js';

export type UserRole = 'teacher' | 'student' | 'parent';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  school?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, role: UserRole, meta: { name: string; school?: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEV_BYPASS_STORAGE_KEY = 'dev_bypass_user';

const isUserRole = (value: unknown): value is UserRole => value === 'teacher' || value === 'student' || value === 'parent';

function readDevBypassUser(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(DEV_BYPASS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AppUser>;
    if (!parsed?.id || !parsed?.name || !parsed?.email || !isUserRole(parsed?.role)) return null;

    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      school: parsed.school,
      phone: parsed.phone,
      bio: parsed.bio,
      avatar_url: parsed.avatar_url,
    };
  } catch {
    return null;
  }
}

function clearDevBypassUser() {
  try {
    sessionStorage.removeItem(DEV_BYPASS_STORAGE_KEY);
  } catch {}
}

async function fetchUserProfile(userId: string): Promise<AppUser | null> {
  const supabase = getSupabaseClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (!profile || !roleData) return null;

  return {
    id: userId,
    name: profile.name,
    email: profile.email,
    role: roleData.role as UserRole,
    school: profile.school || undefined,
    phone: profile.phone || undefined,
    bio: profile.bio || undefined,
    avatar_url: profile.avatar_url || undefined,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isBackendConfigured) {
      setUser(readDevBypassUser());
      setSession(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();

    // Safety timeout: never stay loading forever
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    // Clear stale sessions that can't be refreshed
    const clearStaleSession = () => {
      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (storageKey) localStorage.removeItem(storageKey);
      } catch {}
      setUser(readDevBypassUser());
      setSession(null);
      setLoading(false);
      clearTimeout(loadingTimeout);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'TOKEN_REFRESHED' && !nextSession) {
        clearStaleSession();
        return;
      }
      setSession(nextSession);
      if (nextSession?.user) {
        setTimeout(async () => {
          try {
            const appUser = await fetchUserProfile(nextSession.user.id);
            setUser(appUser);
          } catch {
            setUser(readDevBypassUser());
          }
          setLoading(false);
          clearTimeout(loadingTimeout);
        }, 0);
      } else {
        setUser(readDevBypassUser());
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        fetchUserProfile(initialSession.user.id).then((appUser) => {
          setUser(appUser);
          setLoading(false);
          clearTimeout(loadingTimeout);
        }).catch(() => {
          setUser(readDevBypassUser());
          setLoading(false);
          clearTimeout(loadingTimeout);
        });
      } else {
        setUser(readDevBypassUser());
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    }).catch(() => {
      clearStaleSession();
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    clearDevBypassUser();
    if (!isBackendConfigured) return { error: 'Backend is not configured for this build yet.' };
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Network error — please check your connection and try again.' };
    }
  };

  const signup = async (email: string, password: string, role: UserRole, meta: { name: string; school?: string }) => {
    clearDevBypassUser();
    if (!isBackendConfigured) return { error: 'Backend is not configured for this build yet.' };
    try {
      const { error } = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: {
          data: { name: meta.name, role, school: meta.school || '' },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Network error — please check your connection and try again.' };
    }
  };

  const logout = async () => {
    clearDevBypassUser();
    if (!isBackendConfigured) return;
    await getSupabaseClient().auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user && isBackendConfigured) {
      const appUser = await fetchUserProfile(session.user.id);
      setUser(appUser);
      return;
    }

    setUser(readDevBypassUser());
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout, refreshProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  login: async () => ({ error: 'Auth not ready' }),
  signup: async () => ({ error: 'Auth not ready' }),
  logout: async () => {},
  refreshProfile: async () => {},
  isAuthenticated: false,
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  return ctx ?? defaultAuthContext;
};
