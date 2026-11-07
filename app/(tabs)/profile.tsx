import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Buttons';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/hooks/useAuth';
import { useLocationPermission } from '../../src/hooks/useLocationPermission';
import { useNotices } from '../../src/hooks/useNotices';
import { colors, radius, spacing, typography } from '../../src/theme';
import { confirmLogout } from '../../src/utils/confirm';
import { toMessage } from '../../src/utils/errors';

const PERMISSION_LABELS = { granted: 'Allowed', denied: 'Denied', undetermined: 'Not requested yet' } as const;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={typography.label}>{label}</Text>
      <Text style={typography.body}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const { notices, loading, error } = useNotices();
  const locationPermission = useLocationPermission();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!(await confirmLogout())) return;
    setLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Could not log out', toMessage(error));
      setLoggingOut(false);
    }
  };

  return (
    <Screen scroll edges={['left', 'right']}>
      <View style={styles.card}>
        <InfoRow label="Name" value={profile?.full_name || 'Loading...'} />
        <InfoRow label="Email" value={user?.email ?? ''} />
        <InfoRow label="Notices posted" value={!loading && !error ? String(notices.length) : '—'} />
        <InfoRow label="Location permission" value={locationPermission ? PERMISSION_LABELS[locationPermission] : 'Checking...'} />
      </View>
      <Button label="Log out" variant="danger" icon="log-out-outline" onPress={handleLogout} loading={loggingOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  row: { gap: spacing.xs },
});