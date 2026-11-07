import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../src/components/Buttons';
import { useAuth } from '../../src/hooks/useAuth';
import {
  cancelConnection,
  ConnectionRequest,
  DiscoverableStudent,
  fetchMyConnections,
  getDiscoverableStudents,
  sendConnectionRequest,
  updateConnectionStatus,
  updateUserInterests,
} from '../../src/services/connectionServices';
import { STUDENT_INTERESTS } from '../../src/constants/interests';
import { colors, radius, spacing } from '../../src/theme';
import { toMessage } from '../../src/utils/errors';

export default function ConnectionsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const userId = user?.id;
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [discoverable, setDiscoverable] = useState<DiscoverableStudent[]>([]);
  const [myConnections, setMyConnections] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const initializedProfileId = useRef<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId || profile?.role !== 'student') {
      if (profile?.role) setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (initializedProfileId.current !== profile.id) {
        setSelectedInterests(profile.interests ?? []);
        setIsDiscoverable(profile.is_discoverable);
        initializedProfileId.current = profile.id;
      }
      const [students, connections] = await Promise.all([
        getDiscoverableStudents(),
        fetchMyConnections(),
      ]);
      setDiscoverable(students);
      setMyConnections(connections);
      setLoadError(null);
    } catch (error) {
      setLoadError(toMessage(error));
    } finally {
      setLoading(false);
    }
  }, [userId, profile]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSavePreferences = async () => {
    if (!user || profile?.role !== 'student' || saving) return;
    setSaving(true);
    try {
      await updateUserInterests(selectedInterests, isDiscoverable);
      Alert.alert('Preferences saved', 'Your interests have been updated.');
      try {
        await refreshProfile();
      } catch (error) {
        setLoadError(toMessage(error));
      }
      await loadData();
    } catch (error) {
      Alert.alert('Could not save preferences', toMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!user || profile?.role !== 'student') return;
    try {
      await sendConnectionRequest(receiverId);
      await loadData();
    } catch (error) {
      Alert.alert('Could not send request', toMessage(error));
    }
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      await updateConnectionStatus(requestId, status);
      await loadData();
    } catch (error) {
      Alert.alert('Could not update request', toMessage(error));
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await cancelConnection(requestId);
      await loadData();
    } catch (error) {
      Alert.alert('Could not cancel request', toMessage(error));
    }
  };

  if (profile?.role && profile.role !== 'student') {
    return (
      <View style={styles.center}>
        <Text>The Connections feature is only available for student accounts.</Text>
      </View>
    );
  }

  if (loading || !profile) return <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />;

  return (
    <ScrollView style={styles.container}>
      {loadError ? (
        <View style={styles.errorBlock}>
          <Text style={styles.error}>{loadError}</Text>
          <Button label="Try again" variant="secondary" onPress={() => void loadData()} />
        </View>
      ) : null}
      {/* 1. Select Interests */}
      <Text style={styles.heading}>Your Interests</Text>
      <View style={styles.chipContainer}>
        {STUDENT_INTERESTS.map((interest) => (
          <TouchableOpacity
            key={interest}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selectedInterests.includes(interest), disabled: saving }}
            disabled={saving}
            style={[styles.chip, selectedInterests.includes(interest) && styles.chipActive]}
            onPress={() => toggleInterest(interest)}
          >
            <Text style={selectedInterests.includes(interest) ? styles.chipTextActive : styles.chipText}>
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.discoverabilityRow}>
        <View style={styles.discoverabilityText}>
          <Text style={styles.name}>Show me to students with shared interests</Text>
          <Text style={styles.status}>Turn this on to appear in other students’ suggestions.</Text>
        </View>
        <Switch
          accessibilityLabel="Allow other students to discover me"
          value={isDiscoverable}
          onValueChange={setIsDiscoverable}
          disabled={saving}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: saving, busy: saving }}
        disabled={saving}
        style={[styles.button, saving && styles.disabled]}
        onPress={() => void handleSavePreferences()}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
      </TouchableOpacity>

      {/* 2. Discoverable Students */}
      <Text style={styles.heading}>Students with Shared Interests</Text>
      {discoverable.length === 0 ? (
        <Text style={styles.emptyText}>
          {selectedInterests.length === 0
            ? 'Select and save at least one interest to find other students.'
            : !isDiscoverable
              ? 'Turn on discoverability and save your preferences to find students.'
              : 'No discoverable students share your saved interests yet. Other students must select the same interests and allow discovery.'}
        </Text>
      ) : (
        discoverable.map((student) => (
          <View key={student.id} style={styles.card}>
            <Text style={styles.name}>{student.full_name}</Text>
            <Text style={styles.status}>Shared interests: {student.shared_interests.join(', ')}</Text>
            <TouchableOpacity style={styles.smallButton} onPress={() => handleSendRequest(student.id)}>
              <Text style={styles.smallButtonText}>Send Connection Request</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* 3. Incoming & Accepted Connections */}
      <Text style={styles.heading}>Requests & Connections</Text>
      {myConnections.map((conn) => {
        return (
          <View key={conn.request_id} style={styles.card}>
            <Text style={styles.name}>{conn.other_name}</Text>
            <Text style={styles.status}>Status: {conn.status}</Text>
            
            <View style={styles.actionRow}>
              {conn.direction === 'incoming' && conn.status === 'pending' && (
                <>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => void handleRespond(conn.request_id, 'accepted')}>
                    <Text style={styles.btnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => void handleRespond(conn.request_id, 'declined')}>
                    <Text style={styles.btnText}>Decline</Text>
                  </TouchableOpacity>
                </>
              )}
              {conn.direction === 'outgoing' && conn.status === 'pending' && (
                <TouchableOpacity style={styles.declineBtn} onPress={() => void handleCancel(conn.request_id)}>
                  <Text style={styles.btnText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.background },
  loader: { flex: 1, backgroundColor: colors.background },
  heading: { fontSize: 18, fontWeight: 'bold', marginVertical: spacing.sm + spacing.xs, color: colors.text },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: colors.onPrimary, fontWeight: 'bold' },
  discoverabilityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  discoverabilityText: { flex: 1, gap: spacing.xs },
  button: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.onPrimary, fontWeight: 'bold' },
  emptyText: { color: colors.textMuted, fontStyle: 'italic' },
  error: { color: colors.danger },
  errorBlock: { gap: spacing.sm },
  card: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.surface },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  status: { color: colors.textMuted, fontSize: 12 },
  smallButton: { backgroundColor: colors.primary, padding: spacing.sm, borderRadius: radius.sm, marginTop: spacing.sm, alignItems: 'center' },
  smallButtonText: { color: colors.onPrimary, fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  acceptBtn: { backgroundColor: colors.success, padding: spacing.sm, borderRadius: radius.sm },
  declineBtn: { backgroundColor: colors.danger, padding: spacing.sm, borderRadius: radius.sm },
  btnText: { color: colors.onPrimary, fontSize: 12 },
});