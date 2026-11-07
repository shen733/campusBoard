import { supabase } from './supabase';

export const NOTICE_REACTIONS = [
  { value: 'like', label: 'Like', emoji: '👍' },
  { value: 'love', label: 'Love', emoji: '❤️' },
  { value: 'care', label: 'Care', emoji: '🤗' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'angry', label: 'Angry', emoji: '😡' },
] as const;

export type NoticeReaction = (typeof NOTICE_REACTIONS)[number]['value'];

export interface NoticeComment {
  id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface NoticeReactionCount {
  reaction: NoticeReaction;
  reaction_count: number;
  reacted_by_me: boolean;
}

export async function fetchNoticeComments(noticeId: string): Promise<NoticeComment[]> {
  const { data, error } = await supabase.rpc('get_notice_comments', { p_notice_id: noticeId });
  if (error) throw error;
  return (data ?? []) as NoticeComment[];
}

export async function fetchNoticeReactions(noticeId: string): Promise<NoticeReactionCount[]> {
  const { data, error } = await supabase.rpc('get_notice_reaction_summary', { p_notice_id: noticeId });
  if (error) throw error;
  return (data ?? []) as NoticeReactionCount[];
}

export async function setNoticeReaction(
  noticeId: string,
  userId: string,
  reaction: NoticeReaction,
  currentReaction: NoticeReaction | null,
): Promise<void> {
  if (currentReaction === reaction) {
    const { error } = await supabase
      .from('notice_reactions')
      .delete()
      .eq('notice_id', noticeId)
      .eq('user_id', userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('notice_reactions')
    .upsert({ notice_id: noticeId, user_id: userId, reaction }, { onConflict: 'notice_id,user_id' });
  if (error) throw error;
}

export async function addNoticeComment(noticeId: string, userId: string, body: string): Promise<void> {
  const { error } = await supabase.from('notice_comments').insert({
    notice_id: noticeId,
    user_id: userId,
    body,
  });
  if (error) throw error;
}

export async function deleteNoticeComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('notice_comments').delete().eq('id', commentId);
  if (error) throw error;
}
