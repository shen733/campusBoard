import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface Props {
  fullName?: string | null;
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(fullName?: string | null): string {
  const firstName = fullName?.trim().split(/\s+/)[0];
  return firstName || 'there';
}

export function GreetingHeader({ fullName }: Props) {
  const greeting = getGreeting(new Date().getHours());
  const firstName = getFirstName(fullName);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting},</Text>
      <Text style={typography.title} numberOfLines={1}>
        {firstName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  greeting: { ...typography.body, color: colors.textMuted },
});
