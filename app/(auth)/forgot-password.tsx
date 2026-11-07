import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/Buttons';
import { Screen } from '../../src/components/Screen';
import { FormField } from '../../src/components/TextField';
import { useAuth } from '../../src/hooks/useAuth';
import { colors, spacing, typography } from '../../src/theme';
import { toMessage } from '../../src/utils/errors';
import { ForgotPasswordValues, forgotPasswordSchema } from '../../src/utils/validators';

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { control, handleSubmit } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (error) {
      Alert.alert('Could not send reset email', toMessage(error));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen scroll edges={['top', 'left', 'right', 'bottom']} contentStyle={styles.content}>
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.body}>Enter the email you registered with and we will send you a reset link.</Text>
      <FormField control={control} name="email" label="Email" placeholder="you@example.com" keyboardType="email-address" autoComplete="email" />
      {sent ? <Text style={styles.success}>If that email has an account, a reset link is on its way.</Text> : null}
      <Button label="Send reset link" onPress={submit} loading={submitting} />
      <Link href="/(auth)/login" style={styles.link}>Back to log in</Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.md },
  title: { ...typography.title, color: colors.primary },
  body: { ...typography.body, color: colors.textMuted },
  success: { color: colors.success, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '600', fontSize: 15, textAlign: 'center', marginTop: spacing.sm },
});