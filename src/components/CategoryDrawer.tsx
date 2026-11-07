import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { CATEGORIES, Category } from '../types';

interface Props {
  selected: Category | 'All';
  onSelect: (category: Category | 'All') => void;
}

const OPTIONS: (Category | 'All')[] = ['All', ...CATEGORIES];

export function CategoryDrawer({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Categories, currently ${selected}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <Ionicons name="menu-outline" size={21} color={colors.primary} />
        <Text style={styles.triggerText}>Categories</Text>
        <Text style={styles.currentCategory}>{selected}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      {open ? (
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close categories"
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />
          <View accessibilityViewIsModal style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View style={styles.headingGroup}>
                <Text style={styles.title}>Categories</Text>
                <Text style={styles.subtitle}>Browse campus notices</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close categories"
                hitSlop={10}
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.options}>
              {OPTIONS.map((category) => {
                const active = selected === category;
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onSelect(category);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      active && styles.optionActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{category}</Text>
                    {active ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerText: { color: colors.text, fontWeight: '600' },
  currentCategory: { ...typography.caption, marginLeft: 'auto' },
  overlay: { ...StyleSheet.absoluteFill, zIndex: 10, justifyContent: 'flex-start' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  drawer: {
    width: 290,
    maxWidth: '84%',
    minHeight: '100%',
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    elevation: 12,
  },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headingGroup: { gap: spacing.xs },
  title: { ...typography.heading, fontSize: 20 },
  subtitle: { ...typography.caption },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  options: { gap: spacing.xs },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: colors.surface },
  optionText: { color: colors.text, fontSize: 16 },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
