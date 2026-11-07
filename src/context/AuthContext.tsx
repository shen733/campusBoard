import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import * as authService from '../services/authServices';
import { clearNoticeCache } from '../services/cacheServices';
import { supabase } from '../services/supabase';
import { Profile } from '../types';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<authService.SignUpResult>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  // Token refresh timers should only run while the app is in the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, []);

  const userId = session?.user.id;
  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const loaded = await authService.fetchProfile();
    setProfile(loaded);
  }, [userId]);

  useEffect(() => {
    void Promise.resolve()
      .then(refreshProfile)
      .catch((error: unknown) => console.error('Could not load the signed-in profile:', error));
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    await clearNoticeCache();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn: authService.signIn,
      signUp: authService.signUp,
      signOut,
      requestPasswordReset: authService.requestPasswordReset,
      refreshProfile,
    }),
    [session, profile, loading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}