import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

const palette: Record<Variant, { background: string; text: string; border: string }> = {
  primary: { background: colors.primary, text: colors.onPrimary, border: colors.primary },
  secondary: { background: colors.surface, text: colors.primary, border: colors.border },
  danger: { background: colors.danger, text: colors.onPrimary, border: colors.danger },
};

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, icon }: Props) {
  const colorSet = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colorSet.background, borderColor: colorSet.border },
        (pressed || inactive) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colorSet.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={colorSet.text} /> : null}
          <Text style={[styles.label, { color: colorSet.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dimmed: { opacity: 0.6 },
  label: { fontSize: 16, fontWeight: '600' },
});