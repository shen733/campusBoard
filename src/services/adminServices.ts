import { supabase } from './supabase';

export interface StudentInvite {
  email: string;
  created_at: string;
  consumed_at: string | null;
}

export async function fetchStudentInvites(): Promise<StudentInvite[]> {
  const { data, error } = await supabase
    .from('student_invites')
    .select('email, created_at, consumed_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function inviteStudent(email: string, adminId: string): Promise<void> {
  const { error } = await supabase
    .from('student_invites')
    .insert({ email: email.trim().toLowerCase(), invited_by: adminId });
  if (error) throw error;
}

export async function revokeStudentInvite(email: string): Promise<void> {
  const { error } = await supabase
    .from('student_invites')
    .delete()
    .eq('email', email)
    .is('consumed_at', null);
  if (error) throw error;
}
