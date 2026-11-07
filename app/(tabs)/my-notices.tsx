import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { NoticeCard } from '../../src/components/NoticeCard';
import { Screen } from '../../src/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../src/components/StateViews';
import { useAuth } from '../../src/hooks/useAuth';
import { useNoticeActions } from '../../src/hooks/useNoticeActions';
import { useNotices } from '../../src/hooks/useNotices';
import { spacing } from '../../src/theme';
import { confirmDelete } from '../../src/utils/confirm';
import { toMessage } from '../../src/utils/errors';

export default function MyNoticesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notices, loading, error, refreshing, refetch } = useNotices({ userId: user?.id ?? null });
  const { remove } = useNoticeActions();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (deletingId || !(await confirmDelete(title))) return;
    setDeletingId(id);
    try {
      await remove(id);
      await refetch();
    } catch (error) {
      Alert.alert('Could not delete notice', toMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingView message="Loading your notices..." />;
  if (error) return <ErrorView message={error} onRetry={refetch} />;

  return (
    <Screen edges={['left', 'right']}>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <NoticeCard
            notice={item}
            onPress={() => router.push({ pathname: '/notices/[id]', params: { id: item.id } })}
            onEdit={() => router.push({ pathname: '/notices/edits', params: { id: item.id } })}
            onDelete={() => handleDelete(item.id, item.title)}
          />
        )}
        ListEmptyComponent={
          <EmptyView
            icon="document-text-outline"
            title="You have not posted anything"
            message="Notices you post will show up here so you can edit or delete them."
            actionLabel="Post your first notice"
            onAction={() => router.push('/notices/create')}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.lg, flexGrow: 1 },
});