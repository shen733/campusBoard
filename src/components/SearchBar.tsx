import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
}

export function SearchBar({ value, onChangeText }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={spacing.lg} color={colors.textMuted} />
      <TextInput
        accessibilityLabel="Search notices"
        value={value}
        onChangeText={onChangeText}
        placeholder="Search notices..."
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={spacing.sm}
          onPress={() => onChangeText('')}
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
        >
          <Ionicons name="close-circle" size={spacing.lg} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  input: { flex: 1, minHeight: spacing.xl + spacing.lg, color: colors.text, paddingVertical: spacing.sm },
  clear: { padding: spacing.xs },
  pressed: { opacity: 0.65 },
});
