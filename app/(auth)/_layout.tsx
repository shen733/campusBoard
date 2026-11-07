import { Redirect, Stack } from 'expo-router';
import { LoadingView } from '../../src/components/StateViews';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/theme';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingView message="Checking your session..." />;
  if (session) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}