import { supabase } from './supabase';

export interface DiscoverableStudent {
  id: string;
  full_name: string;
  shared_interests: string[];
}

export interface ConnectionRequest {
  request_id: string;
  other_user_id: string;
  other_name: string;
  shared_interests: string[];
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  direction: 'incoming' | 'outgoing';
  created_at: string;
}

function throwConnectionError(error: { code?: string; message: string }): never {
  if (error.code === 'PGRST202' || error.code === '42883') {
    throw new Error(
      'Campus connections are not set up in Supabase yet. Run supabase/setup.sql in the Supabase SQL Editor, then reload the schema cache.',
    );
  }
  throw error;
}

export async function updateUserInterests(interests: string[], isDiscoverable: boolean): Promise<void> {
  const { error } = await supabase.rpc('update_my_interests', {
    p_interests: interests,
    p_is_discoverable: isDiscoverable,
  });
  if (error) throwConnectionError(error);
}

export async function getDiscoverableStudents(): Promise<DiscoverableStudent[]> {
  const { data, error } = await supabase.rpc('discover_students');
  if (error) throwConnectionError(error);
  return data ?? [];
}

export async function fetchMyConnections(): Promise<ConnectionRequest[]> {
  const { data, error } = await supabase.rpc('list_my_connections');
  if (error) throwConnectionError(error);
  return data ?? [];
}

export async function sendConnectionRequest(recipientId: string): Promise<void> {
  const { error } = await supabase.rpc('send_connection_request', { p_recipient_id: recipientId });
  if (error) throwConnectionError(error);
}

export async function updateConnectionStatus(
  requestId: string,
  status: 'accepted' | 'declined',
): Promise<void> {
  const { error } = await supabase.rpc('respond_to_connection_request', {
    p_request_id: requestId,
    p_action: status === 'accepted' ? 'accept' : 'decline',
  });
  if (error) throwConnectionError(error);
}

export async function cancelConnection(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('respond_to_connection_request', {
    p_request_id: requestId,
    p_action: 'cancel',
  });
  if (error) throwConnectionError(error);
}
