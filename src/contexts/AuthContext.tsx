import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/integrations/firebase/client';

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
  session: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, role: UserRole, meta: { name: string; school?: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_BYPASS_KEY = 'dev_bypass_user';
const isUserRole = (v: unknown): v is UserRole => v === 'teacher' || v === 'student' || v === 'parent';

function readDevBypassUser(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(DEV_BYPASS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<AppUser>;
    if (!p?.id || !p?.name || !p?.email || !isUserRole(p?.role)) return null;
    return { id: p.id, name: p.name, email: p.email, role: p.role, school: p.school, phone: p.phone, bio: p.bio, avatar_url: p.avatar_url };
  } catch { return null; }
}

async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  try {
    const snap = await getDoc(doc(db, 'profiles', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: uid,
      name: data.name || '',
      email: data.email || '',
      role: data.role as UserRole,
      school: data.school,
      phone: data.phone,
      bio: data.bio,
      avatar_url: data.avatar_url,
    };
  } catch { return null; }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const devUser = readDevBypassUser();
    if (devUser) {
      setUser(devUser);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setSession(firebaseUser);
      if (firebaseUser) {
        const appUser = await fetchUserProfile(firebaseUser.uid);
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password'
        ? 'Invalid email or password'
        : err?.message || 'Login failed';
      return { error: msg };
    }
  };

  const signup = async (email: string, password: string, role: UserRole, meta: { name: string; school?: string }) => {
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
      // Create profile document in Firestore
      await setDoc(doc(db, 'profiles', fbUser.uid), {
        name: meta.name,
        email,
        role,
        school: meta.school || '',
        phone: '',
        bio: '',
        avatar_url: '',
        expertise: [],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return {};
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : err?.message || 'Signup failed';
      return { error: msg };
    }
  };

  const logout = async () => {
    sessionStorage.removeItem(DEV_BYPASS_KEY);
    await signOut(auth);
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    const current = session || auth.currentUser;
    if (current) {
      const appUser = await fetchUserProfile(current.uid);
      setUser(appUser);
    } else {
      setUser(readDevBypassUser());
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout, refreshProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: null, session: null, loading: true,
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
