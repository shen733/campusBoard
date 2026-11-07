import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Notice } from '../types';

interface Props {
  notice: Notice | null;
  onPress: (notice: Notice) => void;
}

export function EmergencyBanner({ notice, onPress }: Props) {
  if (!notice) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Emergency notice: ${notice.title}`}
      onPress={() => onPress(notice)}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="warning" size={spacing.lg} color={colors.danger} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Campus emergency</Text>
        <Text style={styles.title} numberOfLines={2}>
          {notice.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {notice.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={spacing.md} color={colors.danger} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderLeftWidth: spacing.xs,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: spacing.xl,
    alignItems: 'center',
  },
  content: { flex: 1, gap: spacing.xs },
  label: { color: colors.danger, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { ...typography.heading },
  description: { ...typography.caption },
  pressed: { opacity: 0.75 },
});
