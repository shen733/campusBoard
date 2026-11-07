import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors, radius, spacing, typography } from '../theme';
import {
  addNoticeComment,
  deleteNoticeComment,
  fetchNoticeComments,
  fetchNoticeReactions,
  NOTICE_REACTIONS,
  NoticeComment,
  NoticeReaction,
  NoticeReactionCount,
  setNoticeReaction,
} from '../services/noticeEngagementService';
import { formatDateTime } from '../utils/formatter';
import { toMessage } from '../utils/errors';

interface Props {
  noticeId: string;
  canModerate: boolean;
}

export function NoticeEngagement({ noticeId, canModerate }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<NoticeComment[]>([]);
  const [reactionCounts, setReactionCounts] = useState<NoticeReactionCount[]>([]);
  const [myReaction, setMyReaction] = useState<NoticeReaction | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const [nextComments, nextReactions] = await Promise.all([
        fetchNoticeComments(noticeId),
        fetchNoticeReactions(noticeId),
      ]);
      setComments(nextComments);
      setReactionCounts(nextReactions);
      setMyReaction(nextReactions.find((item) => item.reacted_by_me)?.reaction ?? null);
    } catch (error) {
      setErrorMessage(toMessage(error));
    } finally {
      setLoading(false);
    }
  }, [noticeId, user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [load]);

  const handleReaction = async (reaction: NoticeReaction) => {
    if (!user || saving) return;
    setSaving(true);
    try {
      await setNoticeReaction(noticeId, user.id, reaction, myReaction);
      await load();
    } catch (error) {
      Alert.alert('Could not save reaction', toMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    const body = commentText.trim();
    if (!user || !body || saving) return;
    setSaving(true);
    try {
      await addNoticeComment(noticeId, user.id, body);
      setCommentText('');
      await load();
    } catch (error) {
      Alert.alert('Could not post comment', toMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = (comment: NoticeComment) => {
    Alert.alert('Delete comment?', 'This comment will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            try {
              await deleteNoticeComment(comment.id);
              await load();
            } catch (error) {
              Alert.alert('Could not delete comment', toMessage(error));
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <Text style={typography.heading}>Reactions</Text>
      <View style={styles.reactions}>
        {NOTICE_REACTIONS.map(({ value, emoji, label }) => {
          const count = reactionCounts.find((item) => item.reaction === value)?.reaction_count ?? 0;
          const selected = myReaction === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${count} reactions`}
              accessibilityState={{ selected, disabled: saving }}
              disabled={saving}
              onPress={() => void handleReaction(value)}
              style={[styles.reaction, selected && styles.reactionSelected, saving && styles.disabled]}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={[styles.reactionText, selected && styles.reactionTextSelected]}>{count}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={typography.heading}>Comments ({comments.length})</Text>
      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Write a comment"
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Add a comment..."
          placeholderTextColor={colors.textMuted}
          maxLength={1000}
          multiline
          editable={!saving}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          disabled={!commentText.trim() || saving}
          onPress={() => void handleAddComment()}
          style={[styles.postButton, (!commentText.trim() || saving) && styles.disabled]}
        >
          <Text style={styles.postButtonText}>{saving ? 'Please wait...' : 'Post'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : errorMessage ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable accessibilityRole="button" onPress={() => void load()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : comments.length === 0 ? (
        <Text style={styles.emptyText}>No comments yet. Start the conversation.</Text>
      ) : (
        <View style={styles.commentList}>
          {comments.map((comment) => {
            const canDelete = comment.user_id === user?.id || canModerate;
            return (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthor}>
                    <Text style={styles.authorName}>{comment.author_name}</Text>
                    <Text style={styles.date}>{formatDateTime(comment.created_at)}</Text>
                  </View>
                  {canDelete ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Delete comment"
                      hitSlop={8}
                      disabled={saving}
                      onPress={() => handleDeleteComment(comment)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.commentBody}>{comment.body}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginTop: spacing.md },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reaction: {
    minWidth: 56,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reactionSelected: { borderColor: colors.primary, backgroundColor: '#1E3553' },
  emoji: { fontSize: 17 },
  reactionText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  reactionTextSelected: { color: colors.text },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlignVertical: 'top',
  },
  postButton: {
    minHeight: 44,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  postButtonText: { color: colors.onPrimary, fontWeight: '600' },
  disabled: { opacity: 0.55 },
  emptyText: { ...typography.body, color: colors.textMuted },
  errorRow: { gap: spacing.xs },
  errorText: { color: colors.danger },
  retryText: { color: colors.primary, fontWeight: '600' },
  commentList: { gap: spacing.sm },
  comment: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface },
  commentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  commentAuthor: { flex: 1, gap: 2 },
  authorName: { color: colors.text, fontWeight: '600' },
  date: { color: colors.textMuted, fontSize: 12 },
  commentBody: { color: colors.text, lineHeight: 21 },
});
