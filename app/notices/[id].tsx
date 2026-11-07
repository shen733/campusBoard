import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Buttons';
import { CategoryBadge } from '../../src/components/CategoryBadge';
import { NoticeEngagement } from '../../src/components/NoticeEngagement';
import { Screen } from '../../src/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../src/components/StateViews';
import { useAuth } from '../../src/hooks/useAuth';
import { useNotice } from '../../src/hooks/useNotice';
import { useNoticeActions } from '../../src/hooks/useNoticeActions';
import { colors, radius, spacing, typography } from '../../src/theme';
import { confirmDelete } from '../../src/utils/confirm';
import { toMessage } from '../../src/utils/errors';
import { formatDate, formatDateTime } from '../../src/utils/formatter';

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { notice, status, errorMessage, retry } = useNotice(id);
  const { remove } = useNoticeActions();
  const [deleting, setDeleting] = useState(false);

  if (status === 'loading') return <LoadingView message="Loading notice..." />;
  if (status === 'error') return <ErrorView message={errorMessage} onRetry={retry} />;
  if (status === 'not-found' || !notice) {
    return <EmptyView icon="search-outline" title="Notice not found" message="It may have been deleted by its author." actionLabel="Go back" onAction={() => router.back()} />;
  }

  const canManage = notice.user_id === user?.id || profile?.role === 'admin';

  const handleDelete = async () => {
    if (!(await confirmDelete(notice.title))) return;
    setDeleting(true);
    try {
      await remove(notice.id);
      router.back();
    } catch (error) {
      Alert.alert('Could not delete notice', toMessage(error));
      setDeleting(false);
    }
  };

  return (
    <Screen scroll>
      {notice.image_url ? <Image source={{ uri: notice.image_url }} style={styles.image} resizeMode="cover" /> : null}
      <CategoryBadge category={notice.category} />
      <Text style={typography.title}>{notice.title}</Text>
      <View style={styles.meta}>
        <MetaLine icon="person-outline" text={notice.author?.full_name || 'Unknown author'} />
        <MetaLine icon="time-outline" text={`Posted ${formatDate(notice.created_at)}`} />
        {notice.location ? <MetaLine icon="location-outline" text={notice.location} /> : null}
        {notice.event_date ? <MetaLine icon="calendar-outline" text={formatDateTime(notice.event_date)} /> : null}
      </View>
      <Text style={typography.body}>{notice.description}</Text>
      <NoticeEngagement noticeId={notice.id} canModerate={profile?.role === 'admin'} />
      {canManage ? (
        <View style={styles.actions}>
          <Button label="Edit" icon="create-outline" variant="secondary" onPress={() => router.push({ pathname: '/notices/edits', params: { id: notice.id } })} />
          <Button label="Delete" icon="trash-outline" variant="danger" onPress={handleDelete} loading={deleting} />
        </View>
      ) : null}
    </Screen>
  );
}

function MetaLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaLine}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  meta: { gap: spacing.xs },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { ...typography.body, color: colors.textMuted, flex: 1 },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});