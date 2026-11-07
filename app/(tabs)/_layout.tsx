import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, size }: { name: IconName; focused: boolean; size: number }) {
  return <Ionicons name={name} color={focused ? colors.primary : colors.textMuted} size={size} />;
}

export default function TabsLayout() {
  const { profile } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notices',
          tabBarIcon: ({ focused, size }) => <TabIcon name="megaphone-outline" focused={focused} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-notices"
        options={{
          title: 'My Notices',
          tabBarIcon: ({ focused, size }) => <TabIcon name="documents-outline" focused={focused} size={size} />,
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: 'Weather',
          tabBarIcon: ({ focused, size }) => <TabIcon name="partly-sunny-outline" focused={focused} size={size} />,
        }}
      />
      {profile?.role === 'student' ? (
        <Tabs.Screen
          name="connections"
          options={{
            title: 'Connections',
            tabBarIcon: ({ focused, size }) => <TabIcon name="people-outline" focused={focused} size={size} />,
          }}
        />
      ) : (
        <Tabs.Screen name="connections" options={{ href: null }} />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, size }) => <TabIcon name="person-circle-outline" focused={focused} size={size} />,
        }}
      />
      {profile?.role === 'admin' ? (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ focused, size }) => <TabIcon name="shield-checkmark-outline" focused={focused} size={size} />,
          }}
        />
      ) : (
        <Tabs.Screen name="admin" options={{ href: null }} />
      )}
    </Tabs>
  );
}