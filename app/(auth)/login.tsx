import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Buttons';
import { Screen } from '../../src/components/Screen';
import { FormField } from '../../src/components/TextField';
import { useAuth } from '../../src/hooks/useAuth';
import { colors, spacing, typography } from '../../src/theme';
import { toMessage } from '../../src/utils/errors';
import { LoginValues, loginSchema } from '../../src/utils/validators';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async ({ email, password }) => {
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      Alert.alert('Could not log in', toMessage(error));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen scroll edges={['top', 'left', 'right', 'bottom']} contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brand}>CampusBoard</Text>
        <Text style={styles.tagline}>Your campus notices, in one place.</Text>
      </View>
      <FormField control={control} name="email" label="Email" placeholder="you@example.com" keyboardType="email-address" autoComplete="email" />
      <FormField control={control} name="password" label="Password" placeholder="Your password" secureTextEntry autoComplete="password" />
      <Button label="Log in" onPress={submit} loading={submitting} />
      <View style={styles.links}>
        <Link href="/(auth)/forgot-password" style={styles.link}>Forgot password?</Link>
        <Link href="/(auth)/register" style={styles.link}>Create an account</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.md },
  header: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.xs },
  brand: { ...typography.title, color: colors.primary, fontSize: 34 },
  tagline: { ...typography.body, color: colors.textMuted },
  links: { alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  link: { color: colors.primary, fontWeight: '600', fontSize: 15 },
});