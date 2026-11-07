import { Notice, NoticeInput } from '../types';
import { withTimeout } from '../utils/withTimeout';
import { supabase } from './supabase';

const NOTICE_COLUMNS = '*, author:profiles(full_name)';
const IMAGE_BUCKET = 'notice-images';
const PERMISSION_MESSAGE = 'Notice not found, or you do not have permission to change it.';

export async function fetchNotices(): Promise<Notice[]> {
  const { data, error } = await withTimeout(
    supabase.from('notices').select(NOTICE_COLUMNS).order('created_at', { ascending: false }),
  );
  if (error) throw error;
  return (data ?? []) as unknown as Notice[];
}

export async function fetchNotice(id: string): Promise<Notice | null> {
  const { data, error } = await withTimeout(
    supabase.from('notices').select(NOTICE_COLUMNS).eq('id', id).maybeSingle(),
  );
  if (error) throw error;
  return data as unknown as Notice | null;
}

export async function createNotice(userId: string, input: NoticeInput): Promise<Notice> {
  const { data, error } = await withTimeout(
    supabase.from('notices').insert({ ...input, user_id: userId }).select(NOTICE_COLUMNS).single(),
  );
  if (error) throw error;
  return data as unknown as Notice;
}

export async function updateNotice(id: string, input: NoticeInput): Promise<Notice> {
  const { data, error } = await withTimeout(
    supabase
      .from('notices')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(NOTICE_COLUMNS)
      .maybeSingle(),
  );
  if (error) throw error;
  // Row Level Security filters rows the user does not own, so "no row" means "not yours".
  if (!data) throw new Error(PERMISSION_MESSAGE);
  return data as unknown as Notice;
}

export async function deleteNotice(id: string): Promise<void> {
  const { data, error } = await withTimeout(supabase.from('notices').delete().eq('id', id).select('id'));
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(PERMISSION_MESSAGE);
}

/** Uploads to Supabase Storage so the image is visible on every device, not just this phone. */
export async function uploadNoticeImage(userId: string, localUri: string): Promise<string> {
  const response = await withTimeout(fetch(localUri));
  const bytes = await response.arrayBuffer();
  const rawExtension = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const extension = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExtension) ? rawExtension : 'jpg';
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error } = await withTimeout(
    supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, bytes, { contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}` }),
  );
  if (error) throw error;
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}