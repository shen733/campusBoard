import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Notice } from '../types';
import { formatDate } from '../utils/formatter';
import { Button } from './Buttons';
import { CategoryBadge } from './CategoryBadge';

interface Props {
  notice: Notice;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function NoticeCard({ notice, onPress, onEdit, onDelete }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {notice.image_url ? <Image source={{ uri: notice.image_url }} style={styles.image} /> : null}
      <View style={styles.body}>
        <CategoryBadge category={notice.category} />
        <Text style={typography.heading} numberOfLines={2}>
          {notice.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {notice.description}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={14} color={colors.textMuted} />
          <Text style={typography.caption} numberOfLines={1}>
            {notice.author?.full_name || 'Unknown'} · {formatDate(notice.created_at)}
          </Text>
        </View>
        {onEdit || onDelete ? (
          <View style={styles.actions}>
            {onEdit ? <View style={styles.action}><Button label="Edit" icon="create-outline" variant="secondary" onPress={onEdit} /></View> : null}
            {onDelete ? <View style={styles.action}><Button label="Delete" icon="trash-outline" variant="danger" onPress={onDelete} /></View> : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  image: { width: '100%', height: 140, backgroundColor: colors.primaryLight },
  body: { padding: spacing.md, gap: spacing.sm },
  description: { ...typography.body, color: colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  action: { flex: 1 },
});