import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Category } from '../types';

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <View style={[styles.badge, { backgroundColor: colors.category[category] }]}>
      <Text style={styles.text}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  text: { color: colors.onPrimary, fontSize: 12, fontWeight: '600' },
});