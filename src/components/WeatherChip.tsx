import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { describeCondition } from '../services/weatherService';
import { colors, radius, spacing, typography } from '../theme';
import { WeatherState } from '../hooks/useWeather';

interface Props {
  state: WeatherState;
  onPress: () => void;
}

export function WeatherChip({ state, onPress }: Props) {
  if (state.phase !== 'success') return null;

  const condition = describeCondition(state.weather.conditionCode);
  const placeName = state.placeName?.trim() || 'Your location';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Weather for ${placeName}: ${state.weather.temperature} degrees, ${condition.label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Ionicons name={condition.icon} size={spacing.lg} color={colors.primary} />
      <Text style={styles.temperature}>{state.weather.temperature}°</Text>
      <Text style={styles.condition} numberOfLines={1}>
        {condition.label}
      </Text>
      <Text style={styles.placeName} numberOfLines={1}>
        {placeName}
      </Text>
      <Ionicons name="chevron-forward" size={spacing.md} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: spacing.xl + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  temperature: { ...typography.heading },
  condition: { ...typography.caption, flexShrink: 1 },
  placeName: { ...typography.caption, marginLeft: 'auto', maxWidth: '34%' },
  pressed: { opacity: 0.75 },
});
