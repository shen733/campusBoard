import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { CategoryDrawer } from '../../src/components/CategoryDrawer';
import { EmergencyBanner } from '../../src/components/EmergencyBanner';
import { GreetingHeader } from '../../src/components/GreetingHeader';
import { NoticeCard } from '../../src/components/NoticeCard';
import { Screen } from '../../src/components/Screen';
import { EmptyView, ErrorView, LoadingView, OfflineBanner } from '../../src/components/StateViews';
import { SearchBar } from '../../src/components/SearchBar';
import { UpcomingStrip } from '../../src/components/UpcomingStrip';
import { WeatherChip } from '../../src/components/WeatherChip';
import { useAuth } from '../../src/hooks/useAuth';
import { useHomeFeed } from '../../src/hooks/useHomeFeed';
import { useWeather } from '../../src/hooks/useWeather';
import { colors, spacing } from '../../src/theme';
import { Category, Notice } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [query, setQuery] = useState('');
  const { state: weatherState } = useWeather();
  const {
    notices,
    status,
    errorMessage,
    refreshing,
    cachedAt,
    refresh,
    retry,
    emergencyNotice,
    upcomingNotices,
    hasActiveSearch,
  } = useHomeFeed({ category, query });

  const openNotice = useCallback(
    (notice: Notice) =>
      router.push({ pathname: '/notices/[id]', params: { id: notice.id } }),
    [router],
  );
  const openCreate = useCallback(() => router.push('/notices/create'), [router]);
  const openWeather = useCallback(() => router.push('/(tabs)/weather'), [router]);

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <GreetingHeader fullName={profile?.full_name} />
        <CategoryDrawer selected={category} onSelect={setCategory} />
        <WeatherChip state={weatherState} onPress={openWeather} />
        <EmergencyBanner notice={emergencyNotice} onPress={openNotice} />
        <UpcomingStrip notices={upcomingNotices} onPress={openNotice} />
        <SearchBar
          value={query}
          onChangeText={setQuery}
        />
        {cachedAt ? <OfflineBanner savedAt={cachedAt} /> : null}
        {status === 'loading' ? <LoadingView message="Loading notices..." /> : null}
        {status === 'error' ? <ErrorView message={errorMessage} onRetry={retry} /> : null}
      </View>
    ),
    [
      profile?.full_name,
      weatherState,
      openWeather,
      emergencyNotice,
      openNotice,
      upcomingNotices,
      query,
      category,
      cachedAt,
      status,
      errorMessage,
      retry,
    ],
  );

  const listEmpty = useMemo(() => {
    if (status !== 'success') return null;
    if (hasActiveSearch) {
      return (
        <EmptyView
          icon="search-outline"
          title="No matching notices"
          message={`No results for "${query.trim()}"`}
        />
      );
    }
    return (
      <EmptyView
        icon="megaphone-outline"
        title={category === 'All' ? 'No notices yet' : `No ${category} notices`}
        message="Be the first to post something for your campus."
        actionLabel="Post a notice"
        onAction={openCreate}
      />
    );
  }, [status, hasActiveSearch, query, category, openCreate]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty ?? undefined}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        renderItem={({ item }) => <NoticeCard notice={item} onPress={() => openNotice(item)} />}
      />
      <View style={styles.fabWrap} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post a notice"
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={openCreate}
        >
          <Ionicons name="add" size={spacing.xl} color={colors.onPrimary} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  header: { gap: spacing.md },
  fabWrap: { position: 'absolute', right: spacing.md, bottom: spacing.md },
  fab: {
    width: spacing.xl + spacing.lg,
    height: spacing.xl + spacing.lg,
    borderRadius: spacing.xl + spacing.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: spacing.xs,
  },
  fabPressed: { opacity: 0.85 },
});
