import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/Buttons';
import { Screen } from '../../src/components/Screen';
import { FormField } from '../../src/components/TextField';
import { useAuth } from '../../src/hooks/useAuth';
import { colors, spacing, typography } from '../../src/theme';
import { toMessage } from '../../src/utils/errors';
import { RegisterValues, registerSchema } from '../../src/utils/validators';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async ({ fullName, email, password }) => {
    setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp(fullName.trim(), email.trim(), password);
      if (needsEmailConfirmation) {
        Alert.alert('Check your email', 'We sent a confirmation link. Confirm your email, then log in.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      }
      // Otherwise a session now exists and the root layout moves the user into the app.
    } catch (error) {
      Alert.alert('Could not register', toMessage(error));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen scroll edges={['top', 'left', 'right', 'bottom']} contentStyle={styles.content}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.description}>Registration is limited to university emails approved by a CampusBoard administrator.</Text>
      <FormField control={control} name="fullName" label="Full name" placeholder="Your full name" autoCapitalize="words" autoComplete="name" />
      <FormField control={control} name="email" label="Email" placeholder="you@example.com" keyboardType="email-address" autoComplete="email" />
      <FormField control={control} name="password" label="Password" placeholder="At least 8 characters" secureTextEntry />
      <FormField control={control} name="confirmPassword" label="Confirm password" placeholder="Repeat your password" secureTextEntry />
      <Button label="Register" onPress={submit} loading={submitting} />
      <Link href="/(auth)/login" style={styles.link}>Already have an account? Log in</Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.md },
  title: { ...typography.title, color: colors.primary, marginBottom: spacing.sm },
  description: { ...typography.body, color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '600', fontSize: 15, textAlign: 'center', marginTop: spacing.sm },
});