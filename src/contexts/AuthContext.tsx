import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '@/services/firebase';
import { fetchUserProfile } from '@/services/auth';
import { UserProfile } from '@/types';

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  academiaId: string | null;
  role: UserProfile['role'] | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const p = await fetchUserProfile(uid);
    setProfile(p);
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      loading,
      academiaId: profile?.academiaId ?? null,
      role: profile?.role ?? null,
      refreshProfile: async () => {
        const uid = firebaseAuth.currentUser?.uid;
        if (uid) await loadProfile(uid);
      },
    }),
    [firebaseUser, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
