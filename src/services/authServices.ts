import { Profile } from '../types';
import { withTimeout } from '../utils/withTimeout';
import { supabase } from './supabase';

export interface SignUpResult {
  needsEmailConfirmation: boolean;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
  if (error) throw error;
}

export async function signUp(fullName: string, email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await withTimeout(
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
  );
  if (error) throw error;
  // When email confirmation is enabled in Supabase no session is returned until the link is clicked.
  return { needsEmailConfirmation: data.session === null };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await withTimeout(supabase.auth.resetPasswordForEmail(email));
  if (error) throw error;
}

export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await withTimeout(supabase.rpc('get_my_profile').maybeSingle());
  if (error?.code === 'PGRST202') {
    throw new Error(
      'Supabase is missing the get_my_profile database function. Run supabase/setup.sql in your Supabase SQL Editor, then sign out and back in.',
    );
  }
  if (error) throw error;
  return data as Profile | null;
}

export async function updateStudentConnections(interests: string[], isDiscoverable: boolean): Promise<void> {
  const { error } = await withTimeout(
    supabase.rpc('update_my_interests', {
      p_interests: interests,
      p_is_discoverable: isDiscoverable,
    }),
  );
  if (error) throw error;
}