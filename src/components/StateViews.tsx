import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button } from './Buttons';

export function LoadingView({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

interface MessageViewProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  tone?: 'neutral' | 'danger';
}

function MessageView({ icon, title, message, actionLabel, onAction, secondaryLabel, onSecondary, tone = 'neutral' }: MessageViewProps) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={48} color={tone === 'danger' ? colors.danger : colors.textMuted} />
      <Text style={typography.heading}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
      {secondaryLabel && onSecondary ? <Button label={secondaryLabel} onPress={onSecondary} variant="secondary" /> : null}
    </View>
  );
}

export function ErrorView(props: { message: string; onRetry: () => void; title?: string }) {
  return (
    <MessageView
      icon="alert-circle-outline"
      tone="danger"
      title={props.title ?? 'Something went wrong'}
      message={props.message}
      actionLabel="Try again"
      onAction={props.onRetry}
    />
  );
}

export function EmptyView(props: Omit<MessageViewProps, 'tone'>) {
  return <MessageView {...props} />;
}

export function OfflineBanner({ savedAt }: { savedAt: string }) {
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
      <Text style={styles.bannerText}>
        You are offline. Showing notices saved {new Date(savedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warningBackground,
    borderRadius: 8,
  },
  bannerText: { flex: 1, fontSize: 13, color: colors.warning },
});