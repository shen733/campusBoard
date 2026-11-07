import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Notice } from '../types';
import { formatDateTime } from '../utils/formatter';

interface Props {
  notices: Notice[];
  onPress: (notice: Notice) => void;
}

export function UpcomingStrip({ notices, onPress }: Props) {
  if (notices.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={typography.heading}>Coming up</Text>
        <Ionicons name="calendar-outline" size={spacing.lg} color={colors.primary} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cards}
      >
        {notices.map((notice) => (
          <Pressable
            key={notice.id}
            accessibilityRole="button"
            accessibilityLabel={`Upcoming: ${notice.title}, ${notice.event_date ? formatDateTime(notice.event_date) : ''}`}
            onPress={() => onPress(notice)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Text style={styles.category} numberOfLines={1}>
              {notice.category}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {notice.title}
            </Text>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={spacing.md} color={colors.textMuted} />
              <Text style={styles.date} numberOfLines={1}>
                {notice.event_date ? formatDateTime(notice.event_date) : ''}
              </Text>
            </View>
            {notice.location ? (
              <View style={styles.dateRow}>
                <Ionicons name="location-outline" size={spacing.md} color={colors.textMuted} />
                <Text style={styles.date} numberOfLines={1}>
                  {notice.location}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cards: { gap: spacing.sm, paddingRight: spacing.md },
  card: {
    width: 240,
    minHeight: 140,
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  category: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  title: { ...typography.heading, flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  date: { ...typography.caption, flex: 1 },
  pressed: { opacity: 0.75 },
});
