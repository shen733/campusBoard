import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Buttons';
import { NoticeCard } from '../../src/components/NoticeCard';
import { Screen } from '../../src/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../src/components/StateViews';
import { useAuth } from '../../src/hooks/useAuth';
import { useNoticeActions } from '../../src/hooks/useNoticeActions';
import { useNotices } from '../../src/hooks/useNotices';
import {
  fetchStudentInvites,
  inviteStudent,
  revokeStudentInvite,
  StudentInvite,
} from '../../src/services/adminServices';
import { colors, spacing, typography } from '../../src/theme';
import { confirmDelete } from '../../src/utils/confirm';
import { toMessage } from '../../src/utils/errors';

export default function AdminScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { notices, loading, error, refreshing, refetch } = useNotices();
  const { remove } = useNoticeActions();
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<StudentInvite[]>([]);
  const [inviteError, setInviteError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadInvites = useCallback(async () => {
    try {
      setInvites(await fetchStudentInvites());
      setInviteError('');
    } catch (loadError) {
      setInviteError(toMessage(loadError));
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadInvites);
  }, [loadInvites]);

  const submitInvite = async () => {
    if (!user || !email.trim()) return;
    setSaving(true);
    try {
      await inviteStudent(email, user.id);
      setEmail('');
      await loadInvites();
      Alert.alert('Student approved', 'They can now register using this email address.');
    } catch (inviteError) {
      Alert.alert('Could not approve email', toMessage(inviteError));
    } finally {
      setSaving(false);
    }
  };

  const revokeInvite = async (invite: StudentInvite) => {
    if (invite.consumed_at) return;
    try {
      await revokeStudentInvite(invite.email);
      await loadInvites();
    } catch (revokeError) {
      Alert.alert('Could not revoke approval', toMessage(revokeError));
    }
  };

  const deleteNotice = async (id: string, title: string) => {
    if (!(await confirmDelete(title))) return;
    try {
      await remove(id);
      await refetch();
    } catch (deleteError) {
      Alert.alert('Could not delete notice', toMessage(deleteError));
    }
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <Screen>
        <EmptyView icon="lock-closed-outline" title="Admin access required" message="This screen is only available to administrator accounts." />
      </Screen>
    );
  }

  const listHeader = (
    <View style={styles.header}>
      <Text style={typography.title}>Admin tools</Text>
      <Text style={typography.heading}>Approve a student</Text>
      <Text style={typography.body}>Enter their university email. They can register only with this approved address.</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="student@university.edu"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={styles.input}
        editable={!saving}
      />
      <Button label="Approve email" onPress={submitInvite} loading={saving} />
      <Text style={typography.heading}>Approved emails</Text>
      {inviteError ? <Text style={styles.error}>{inviteError}</Text> : null}
      {invites.map((invite) => (
        <View key={invite.email} style={styles.inviteRow}>
          <View style={styles.inviteText}>
            <Text style={styles.email}>{invite.email}</Text>
            <Text style={styles.muted}>{invite.consumed_at ? 'Registered' : 'Waiting to register'}</Text>
          </View>
          {!invite.consumed_at ? (
            <Button label="Revoke" variant="secondary" onPress={() => revokeInvite(invite)} />
          ) : null}
        </View>
      ))}
      <Text style={typography.heading}>Notice moderation</Text>
      {error ? <ErrorView message={error} onRetry={refetch} /> : null}
      {loading ? <LoadingView message="Loading notices..." /> : null}
    </View>
  );

  return (
    <Screen edges={['left', 'right']}>
      <FlatList
        data={loading || error ? [] : notices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => {
          void refetch();
          void loadInvites();
        }}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <NoticeCard
            notice={item}
            onPress={() => router.push({ pathname: '/notices/[id]', params: { id: item.id } })}
            onEdit={() => router.push({ pathname: '/notices/edits', params: { id: item.id } })}
            onDelete={() => deleteNotice(item.id, item.title)}
          />
        )}
        ListEmptyComponent={!loading && !error ? (
          <Text style={styles.muted}>No notices to moderate.</Text>
        ) : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  header: { gap: spacing.md, paddingBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, color: colors.text, backgroundColor: colors.surface },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  inviteText: { flex: 1, gap: spacing.xs },
  email: { color: colors.text, fontWeight: '600' },
  muted: { color: colors.textMuted },
  error: { color: colors.danger },
});
